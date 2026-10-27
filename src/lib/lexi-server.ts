import "server-only";
import type { User } from "@prisma/client";
import { db } from "./db";
import { signTts } from "./voice";
import { chat, llmEnabled } from "./llm";
import { nextStreak, todayKey } from "./profile";
import { GEMINI_VOICES, GEMINI_VOICE_IDS, LEXI_VOICE, type Mood } from "./voices";
import { persona as personaById } from "./preppy/personas";
import * as engine from "./preppy/engine";
import { memoryFrom, pickFlavor, progressFrom, speechParts, topicFor, type LexiSettings, type PastCall } from "./preppy/lexi";
import { parseReview, reviewMessages, speechStats, type LexiReview } from "./preppy/lexi-review";
import { cleanTopicTitle, TOPICS } from "./preppy/topics";
import type { PersonaId } from "./preppy/personas";

// Server side of a call with Lexi, shared by the streaming route and the server actions.
// Internal names keep "preppy" (database rows, quota keys); everything the user sees is Lexi.

export type ConvState = engine.EngineState & { lexi?: LexiSettings; voice?: string };

export type StoredReview = engine.Review & { llm?: LexiReview; llmState?: "pending" | "done" | "failed" };

type Prefs = Pick<User, "persona" | "lexiLang" | "lexiSwear" | "lexiVoice" | "name" | "targetBand">;

/** Lexi's voice and whether it is a woman's: one voice for every user and character. */
export function voiceFor(): { voice: string; female: boolean } {
  return { voice: `g:${LEXI_VOICE}`, female: GEMINI_VOICES.find((v) => v.id === LEXI_VOICE)?.female ?? true };
}

export function settingsFor(user: Prefs, personaId: string, topicTitle?: string): LexiSettings {
  return {
    persona: personaById(personaId).id,
    lang: user.lexiLang === "en" ? "en" : "mix",
    swear: user.lexiSwear,
    name: user.name.split(/\s+/)[0] ?? "",
    band: user.targetBand,
    female: voiceFor().female,
    topicTitle,
  };
}

export type CallStart = { persona: PersonaId; topic: string; topicTitle?: string; voice: string; lang: "mix" | "en"; swear: boolean };

/** A topic for a call where the student picked none: one not talked about for the longest time. */
function nextTopic(recent: string[]): string {
  const fresh = TOPICS.filter((t) => !recent.includes(t.id));
  const pool = fresh.length ? fresh : TOPICS;
  return pool[Math.floor(Math.random() * Math.min(pool.length, 4))].id;
}

/** The progress Lexi should know: what the reviews of the last calls found. */
function pastCalls(calls: { topic: string; state: string; review: string | null; createdAt: Date }[]): PastCall[] {
  return calls.flatMap((c) => {
    if (!c.review) return [];
    const r = JSON.parse(c.review) as StoredReview;
    const title = topicFor(c.topic, (JSON.parse(c.state) as ConvState).topicTitle).title;
    const day = c.createdAt.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
    return [{
      topic: title,
      day,
      bands: r.llm?.bands,
      work: r.llm?.work ?? r.toWork,
      mistakes: (r.llm?.mistakes ?? r.fixes)?.map((m) => ({ wrong: m.wrong, right: m.right })),
    }];
  });
}

/**
 * Opens a call: the picker's choices become the user's defaults, and the conversation is
 * stored with how this call goes (character, memory of earlier calls and the progress their
 * reviews found, flavour, voice). Topic "auto": Lexi leads, on a topic not done lately.
 */
export async function openConversation(user: Pick<User, "id">, o: CallStart) {
  const recent = await db.conversation.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { topic: true, turns: true, state: true, review: true, createdAt: true },
  });
  const auto = o.topic === "auto";
  const custom = o.topic === "custom" ? cleanTopicTitle(o.topicTitle ?? "") : "";
  const topicId = custom ? "custom" : auto ? nextTopic(recent.map((c) => c.topic)) : (TOPICS.find((t) => t.id === o.topic) ?? TOPICS[0]).id;
  const prefs = await db.user.update({
    where: { id: user.id },
    data: { persona: o.persona, lexiVoice: GEMINI_VOICE_IDS.has(o.voice) ? o.voice : "", lexiLang: o.lang, lexiSwear: o.swear },
  });
  const memory = memoryFrom(recent.slice(0, 2).map((c) => ({ topic: c.topic, turns: JSON.parse(c.turns) as engine.Turn[] })));
  const progress = progressFrom(pastCalls(recent.filter((c) => c.review).slice(0, 5)));
  const flavor = pickFlavor(custom ? 0 : (TOPICS.find((t) => t.id === topicId)?.questions.length ?? 0));
  const settings: LexiSettings = {
    ...settingsFor(prefs, o.persona, custom || undefined),
    memory: memory || undefined,
    progress: progress || undefined,
    auto: auto || undefined,
    flavor,
  };
  const { voice } = voiceFor();
  const scripted = engine.start(o.persona, topicId, undefined, custom || undefined);
  const conv = await db.conversation.create({
    data: { userId: user.id, persona: o.persona, topic: topicId, turns: "[]", state: JSON.stringify({ ...scripted.state, lexi: settings, voice } satisfies ConvState) },
  });
  return { conv, settings, voice, topicId, scripted };
}

export function signPart(text: string, voice: string, personaId: string, mood: Mood): string {
  return signTts(text, voice, { mood, style: personaId });
}

export function signReply(text: string, voice: string, personaId: string, mood: Mood): string[] {
  return speechParts(text).map((part) => signPart(part, voice, personaId, mood));
}

// Short sounds Lexi makes the moment the student stops talking, while the answer is being
// written. Voiced once per voice and character, then served from the cache.
const FILLERS: Record<"mix" | "en", string[]> = {
  // Short Russian words come out mangled from the voice model ("Ага" -> "Oh, ha"), so few
  mix: ["Хм…", "Так-так…", "Ммм…"],
  en: ["Hmm…", "Okay…", "Right…", "Mm-hm…", "So…"],
};

export function fillers(s: LexiSettings, voice: string): string[] {
  return FILLERS[s.lang].map((t) => signPart(t, voice, s.persona, "curious"));
}

export function nudge(s: LexiSettings, voice: string): string[] {
  const text = s.lang === "en"
    ? "Hey, I can't hear you. Check your microphone, I put a hint on the screen."
    : "Эй, я тебя не слышу. Проверь микрофон, подсказка на экране.";
  return [signPart(text, voice, s.persona, "curious")];
}

/**
 * Ends a call: the quick rule-based review is stored at once, so the review page always has
 * something; the language model's review replaces it a few seconds later.
 */
export async function finishConversation(id: string): Promise<boolean> {
  const conv = await db.conversation.findUnique({ where: { id } });
  if (!conv || conv.endedAt) return false;
  const turns = JSON.parse(conv.turns) as engine.Turn[];
  const state = JSON.parse(conv.state) as ConvState;
  const r: StoredReview = engine.review(turns, conv.topic, state.topicTitle);
  const answered = turns.some((t) => t.role === "user" && t.text.trim());
  if (llmEnabled() && answered) r.llmState = "pending";
  await db.conversation.update({ where: { id }, data: { review: JSON.stringify(r), endedAt: new Date() } });
  const user = await db.user.findUnique({ where: { id: conv.userId } });
  if (user && r.turns > 0) {
    await db.user.update({
      where: { id: user.id },
      data: { xp: { increment: 5 + r.turns * 2 }, streak: nextStreak(user.streak, user.lastActive), lastActive: todayKey() },
    });
  }
  return r.llmState === "pending";
}

/** The language model's review, stored next to the quick one. Safe to call twice. */
export async function writeReview(id: string): Promise<void> {
  const conv = await db.conversation.findUnique({ where: { id }, include: { user: true } });
  if (!conv?.review) return;
  const stored = JSON.parse(conv.review) as StoredReview;
  if (stored.llm) return;
  const turns = JSON.parse(conv.turns) as engine.Turn[];
  const state = JSON.parse(conv.state) as ConvState;
  const settings = state.lexi ?? settingsFor(conv.user, conv.persona);
  const topic = topicFor(conv.topic, state.topicTitle ?? settings.topicTitle);
  const stats = speechStats(turns);
  let llm: LexiReview | null = null;
  for (let attempt = 0; attempt < 2 && !llm; attempt++) {
    llm = parseReview(await chat(reviewMessages(settings, topic.title, turns), { json: true, maxTokens: 1800, temperature: 0.4, timeoutMs: 45_000, purpose: "llm:review" }), stats);
  }
  const fresh = await db.conversation.findUnique({ where: { id } });
  const now = fresh?.review ? (JSON.parse(fresh.review) as StoredReview) : stored;
  await db.conversation.update({
    where: { id },
    data: { review: JSON.stringify({ ...now, llm: llm ?? undefined, llmState: llm ? "done" : "failed" } satisfies StoredReview) },
  });
}
