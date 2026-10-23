import { after } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { remaining, spend } from "@/lib/access";
import { chatStream, llmEnabled } from "@/lib/llm";
import { GEMINI_VOICE_IDS, type Mood } from "@/lib/voices";
import { persona as personaById, type PersonaId } from "@/lib/preppy/personas";
import { cleanTopicTitle, TOPICS } from "@/lib/preppy/topics";
import * as engine from "@/lib/preppy/engine";
import { chatMessages, isFinal, marksFor, memoryFrom, openingMessages, SayStream, type Parsed } from "@/lib/preppy/lexi";
import { fillers, finishConversation, nudge, settingsFor, signPart, signReply, voiceFor, writeReview, type ConvState } from "@/lib/lexi-server";
import { reportBug } from "@/lib/bug-report";

// A call with Lexi, one request per line, answered as a stream of JSON lines:
//   {"t":"mood","mood":"angry"}           the face changes before she speaks
//   {"t":"say","text":"Стоп. Ты серьёзно"} subtitles as the model writes them
//   {"t":"audio","url":"/api/tts?..."}      a part of the line, ready to be voiced
//   {"t":"end", ...}                        the line is complete (and the call, if final)
// The first sentence is voiced while the model is still writing the rest. If the student
// keeps talking, the page aborts the request: nothing is stored and nothing is charged.

export const dynamic = "force-dynamic";

const startSchema = z.object({
  start: z.object({
    persona: z.enum(["classic", "strict", "kind", "sarcastic", "roast", "bro", "drama", "tsundere", "yandere"]),
    topic: z.string().max(40),
    topicTitle: z.string().max(200).optional(),
    voice: z.string().max(40),
    lang: z.enum(["mix", "en"]),
    swear: z.boolean(),
  }),
});

const turnSchema = z.object({
  turn: z.object({
    id: z.string().max(40),
    text: z.string().max(3000),
    alt: z.string().max(3000).optional(),
    seconds: z.number().min(0).max(600),
    pauses: z.number().int().min(0).max(200).optional(),
    typed: z.boolean().optional(),
    interrupted: z.boolean().optional(),
  }),
});

type Send = (event: Record<string, unknown>) => void;

/** Runs work after the response is sent (the review takes a few seconds). */
function later(work: () => Promise<void>) {
  try {
    after(work);
  } catch {
    work().catch(() => {});
  }
}

// A typed line costs the model and the voice too: it counts as this many seconds of talk
const TYPED_SECONDS = 10;

function stream(run: (send: Send, signal: AbortSignal) => Promise<void>, signal: AbortSignal): Response {
  const enc = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      const send: Send = (e) => {
        try { controller.enqueue(enc.encode(JSON.stringify(e) + "\n")); } catch { /* the page went away */ }
      };
      try {
        await run(send, signal);
      } catch (e) {
        console.error("lexi", (e as Error).message);
        send({ t: "error" });
      }
      try { controller.close(); } catch { /* already closed */ }
    },
  });
  return new Response(body, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}

/**
 * Streams one line of Lexi: the model's answer when it works, the scripted engine's
 * otherwise. Returns what was said.
 */
async function speak(
  send: Send,
  signal: AbortSignal,
  messages: Parameters<typeof chatStream>[0],
  lastAnswer: string,
  voice: string,
  personaId: string,
  fallback: () => { reply: string; fix?: engine.Fix; done?: boolean },
): Promise<{ reply: string; mood: Mood; fix?: engine.Fix; end: boolean; bug?: string }> {
  let mood: Mood | null = null;
  let shown = "";
  const say = new SayStream(lastAnswer);
  const voiceParts = (parts: string[]) => {
    // each part carries the mood changes inside it, so the face turns where the words do
    const marks = say.marks();
    for (const part of parts) send({ t: "audio", url: signPart(part, voice, personaId, mood ?? "neutral"), moods: marksFor(part, marks) });
  };
  const raw = llmEnabled()
    ? await chatStream(messages, (piece) => {
        const r = say.push(piece);
        if (r.mood && !mood) {
          mood = r.mood;
          send({ t: "mood", mood });
        }
        voiceParts(r.parts);
        // Subtitles in pieces of a few words, not every token
        const text = say.current();
        if (text && text !== shown && (text.length - shown.length >= 12 || /[.!?…,]$/.test(text))) {
          shown = text;
          send({ t: "say", text });
        }
      }, { maxTokens: 320, temperature: 0.9, signal, purpose: "llm:turn" })
    : null;
  if (signal.aborted) return { reply: "", mood: "neutral", end: false };
  let parsed: Parsed | null = null;
  if (raw) {
    const done = say.finish();
    parsed = done.parsed;
    if (parsed.say) {
      voiceParts(done.parts);
      if (parsed.say !== shown) send({ t: "say", text: parsed.say });
    }
  }
  if (!parsed?.say) {
    // The model failed or wrote nothing usable: the scripted engine answers instead
    const f = fallback();
    mood = "neutral";
    send({ t: "mood", mood });
    send({ t: "say", text: f.reply });
    for (const url of signReply(f.reply, voice, personaId, "neutral")) send({ t: "audio", url });
    return { reply: f.reply, mood, fix: f.fix, end: !!f.done };
  }
  return { reply: parsed.say, mood: mood ?? parsed.mood ?? "neutral", fix: parsed.fix, end: parsed.end, bug: parsed.bug };
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "auth" }, { status: 401 });
  const json = await req.json().catch(() => null);

  const start = startSchema.safeParse(json);
  if (start.success) {
    const o = start.data.start;
    if ((await remaining(user, "preppy_seconds")) <= 0) return Response.json({ error: "limit" }, { status: 429 });
    const custom = o.topic === "custom" ? cleanTopicTitle(o.topicTitle ?? "") : "";
    const topicId = custom ? "custom" : (TOPICS.find((t) => t.id === o.topic) ?? TOPICS[0]).id;
    // The picker's choices become the user's defaults
    const prefs = await db.user.update({
      where: { id: user.id },
      data: { persona: o.persona, lexiVoice: GEMINI_VOICE_IDS.has(o.voice) ? o.voice : "", lexiLang: o.lang, lexiSwear: o.swear },
    });
    const earlier = await db.conversation.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 2, select: { topic: true, turns: true } });
    const memory = memoryFrom(earlier.map((c) => ({ topic: c.topic, turns: JSON.parse(c.turns) as engine.Turn[] })));
    const settings = { ...settingsFor(prefs, o.persona, custom || undefined), memory: memory || undefined };
    const { voice } = voiceFor(prefs, o.persona);
    const scripted = engine.start(o.persona, topicId, undefined, custom || undefined);
    const conv = await db.conversation.create({
      data: { userId: user.id, persona: o.persona, topic: topicId, turns: "[]", state: JSON.stringify({ ...scripted.state, lexi: settings, voice } satisfies ConvState) },
    });
    return stream(async (send, signal) => {
      send({ t: "call", id: conv.id, female: settings.female, fillers: fillers(settings, voice), nudge: nudge(settings, voice) });
      const out = await speak(send, signal, openingMessages(settings, topicId), "", voice, o.persona, () => ({ reply: scripted.reply }));
      if (signal.aborted) return;
      await db.conversation.update({
        where: { id: conv.id },
        data: { turns: JSON.stringify([{ role: "preppy", text: out.reply, mood: out.mood }] satisfies engine.Turn[]) },
      });
      send({ t: "end", mood: out.mood, final: false, left: await remaining(user, "preppy_seconds") });
    }, req.signal);
  }

  // The page was closed mid-call (sent with navigator.sendBeacon)
  const end = z.object({ end: z.object({ id: z.string().max(40) }) }).safeParse(json);
  if (end.success) {
    const c = await db.conversation.findFirst({ where: { id: end.data.end.id, userId: user.id } });
    if (c && (await finishConversation(c.id))) later(() => writeReview(c.id));
    return Response.json({ ok: true });
  }

  const turn = turnSchema.safeParse(json);
  if (!turn.success) return Response.json({ error: "bad request" }, { status: 400 });
  const o = turn.data.turn;
  const conv = await db.conversation.findFirst({ where: { id: o.id, userId: user.id } });
  if (!conv || conv.endedAt) return Response.json({ error: "over" }, { status: 409 });
  const secs = Math.max(1, Math.min(180, Math.round(o.seconds)));
  if ((await remaining(user, "preppy_seconds")) <= 0) {
    if (await finishConversation(conv.id)) later(() => writeReview(conv.id));
    return Response.json({ error: "limit" }, { status: 429 });
  }

  const personaId = conv.persona as PersonaId;
  const state = JSON.parse(conv.state) as ConvState;
  const settings = state.lexi ?? settingsFor(user, personaId);
  const voice = state.voice ?? voiceFor(user, personaId).voice;
  const answer = o.text.trim().slice(0, 3000);
  const turns = JSON.parse(conv.turns) as engine.Turn[];
  if (o.interrupted) {
    const last = [...turns].reverse().find((t) => t.role === "preppy");
    if (last) last.interrupted = true;
  }
  const userTurn: engine.Turn = {
    role: "user", text: answer, words: (answer.match(/[A-Za-zА-Яа-яЁё']+/g) ?? []).length,
    seconds: o.typed ? 0 : secs, pauses: o.pauses, typed: o.typed || undefined, alt: o.alt?.trim().slice(0, 3000) || undefined,
  };
  const scripted = engine.respond(state, personaId, answer);

  return stream(async (send, signal) => {
    const out = await speak(send, signal, chatMessages(settings, conv.topic, [...turns, userTurn]), answer, voice, personaId,
      () => ({ reply: scripted.reply, fix: scripted.fix, done: scripted.done }));
    if (signal.aborted) return; // the student kept talking: this line never happened
    const studentTurns = turns.filter((t) => t.role === "user").length + 1;
    const final = isFinal({ say: out.reply, end: out.end }, studentTurns);
    if (out.bug) {
      const recent = [...turns, userTurn].slice(-6).map((t) => `${t.role === "user" ? "👤" : "🔥"} ${t.text}`).join("\n");
      reportBug({ where: "call", summary: out.bug, who: user.email, context: recent,
        extra: `звонок ${conv.id}, ${personaId}, ${o.typed ? "текстом" : "голосом"} · ${req.headers.get("user-agent")?.slice(0, 160) ?? ""}` });
    }
    turns.push({ ...userTurn, fix: out.fix });
    turns.push({ role: "preppy", text: out.reply, mood: out.mood });
    await db.conversation.update({
      where: { id: conv.id },
      data: { turns: JSON.stringify(turns), state: JSON.stringify({ ...scripted.state, lexi: settings, voice } satisfies ConvState), seconds: { increment: o.typed ? 0 : secs } },
    });
    const quota = await spend(user, "preppy_seconds", o.typed ? TYPED_SECONDS : secs);
    if (final && (await finishConversation(conv.id))) later(() => writeReview(conv.id));
    send({ t: "end", mood: out.mood, fix: out.fix ?? null, final, left: quota.left });
  }, req.signal);
}
