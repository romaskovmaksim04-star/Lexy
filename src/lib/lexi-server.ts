import "server-only";
import type { User } from "@prisma/client";
import { db } from "./db";
import { signTts } from "./voice";
import { chat, llmEnabled } from "./llm";
import { nextStreak, todayKey } from "./profile";
import { GEMINI_VOICES, GEMINI_VOICE_IDS, type Mood } from "./voices";
import { persona as personaById } from "./preppy/personas";
import * as engine from "./preppy/engine";
import { speechParts, topicFor, type LexiSettings } from "./preppy/lexi";
import { parseReview, reviewMessages, speechStats, type LexiReview } from "./preppy/lexi-review";

// Server side of a call with Lexi, shared by the streaming route and the server actions.
// Internal names keep "preppy" (database rows, quota keys); everything the user sees is Lexi.

export type ConvState = engine.EngineState & { lexi?: LexiSettings; voice?: string };

export type StoredReview = engine.Review & { llm?: LexiReview; llmState?: "pending" | "done" | "failed" };

type Prefs = Pick<User, "persona" | "lexiLang" | "lexiSwear" | "lexiVoice" | "name" | "targetBand">;

/** The Gemini voice for this user and character, and whether it is a woman's voice. */
export function voiceFor(user: Pick<User, "lexiVoice">, personaId: string): { voice: string; female: boolean } {
  const id = GEMINI_VOICE_IDS.has(user.lexiVoice) ? user.lexiVoice : personaById(personaId).voice;
  return { voice: `g:${id}`, female: GEMINI_VOICES.find((v) => v.id === id)?.female ?? true };
}

export function settingsFor(user: Prefs, personaId: string, topicTitle?: string): LexiSettings {
  return {
    persona: personaById(personaId).id,
    lang: user.lexiLang === "en" ? "en" : "mix",
    swear: user.lexiSwear,
    name: user.name.split(/\s+/)[0] ?? "",
    band: user.targetBand,
    female: voiceFor(user, personaId).female,
    topicTitle,
  };
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
