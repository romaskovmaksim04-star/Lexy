// The review after a call with Lexi, written by the language model from the transcript and
// the microphone's numbers. Pure functions (prompt and parsing), tested without the API.

import { persona as personaById } from "./personas.ts";
import type { Turn } from "./engine.ts";
import type { LexiSettings } from "./lexi.ts";

export type Band = number | null;

export type LexiReview = {
  v: 2;
  bands: { overall: Band; fluency: Band; lexical: Band; grammar: Band };
  summary: string;
  strengths: string[];
  work: string[];
  mistakes: { wrong: string; right: string; why: string }[];
  better: { original: string; improved: string }[];
  vocab: { en: string; ru: string; example: string }[];
  next: string[];
};

export type SpeechStats = {
  answers: number;
  englishWords: number;
  speechSeconds: number;
  wpm: number | null; // English words per minute of speech
  longPauses: number; // pauses over a second inside answers
  russianAnswers: number;
  typedAnswers: number;
};

const englishWords = (t: string) => (t.match(/[A-Za-z']+/g) ?? []).length;

export function speechStats(turns: Turn[]): SpeechStats {
  const user = turns.filter((t) => t.role === "user" && t.text.trim());
  const spoken = user.filter((t) => !t.typed);
  const words = user.reduce((a, t) => a + englishWords(t.text), 0);
  const spokenWords = spoken.reduce((a, t) => a + englishWords(t.text), 0);
  const secs = spoken.reduce((a, t) => a + (t.seconds ?? 0), 0);
  return {
    answers: user.length,
    englishWords: words,
    speechSeconds: Math.round(secs),
    wpm: secs >= 20 ? Math.round(spokenWords / (secs / 60)) : null,
    longPauses: spoken.reduce((a, t) => a + (t.pauses ?? 0), 0),
    russianAnswers: user.filter((t) => /[а-яё]/i.test(t.text) && englishWords(t.text) < 3).length,
    typedAnswers: user.length - spoken.length,
  };
}

export function reviewMessages(s: LexiSettings, topicTitle: string, turns: Turn[]) {
  const p = personaById(s.persona);
  const stats = speechStats(turns);
  const transcript = turns
    .map((t) => (t.role === "preppy" ? `LEXI: ${t.text}` : `STUDENT${t.typed ? " (typed)" : ""}: ${t.text || "(silence)"}`))
    .join("\n");
  const system = `You are Lexi, the IELTS speaking coach of LexiUp, writing the review of a practice call you just had with a Russian-speaking student. Write all explanations in Russian, informal «ты», in your character's voice: ${p.character}${s.swear ? " The student allowed profanity: a couple of witty, inventive мат jokes about the call fit the summary (tied to what really happened, not a bare «пиздец» or «блять»)." : " No profanity."}

Judge ONLY the student's English. The transcript comes from speech recognition: ignore spelling and punctuation, and do not count nonsense words that are clearly recognition errors, nor words swapped for one that sounds alike (sitting/seating, code/cold, код/кот). Russian lines are not English mistakes (but answering in Russian means less English to judge).

IELTS Speaking criteria, bands 4-9:
- fluency (Fluency and Coherence): length of answers, linking words, how much they develop ideas, hesitation.
- lexical (Lexical Resource): range and precision of vocabulary, idioms, collocations, paraphrase.
- grammar (Grammatical Range and Accuracy): range of structures, how many errors, whether errors block meaning.
Be honest and calibrated: one-sentence answers with basic words are band 4-5; long developed answers with few errors are 6.5-7+. Use halves (5.5, 6.0). If the student produced fewer than 40 English words, set every band to null and say in the summary that there was too little English to judge.
Pronunciation cannot be judged from a transcript: do not mention a pronunciation band.

Measured by the app: ${stats.answers} answers, ${stats.englishWords} English words, ${stats.speechSeconds} s of speech${stats.wpm ? `, ${stats.wpm} English words per minute of speech` : ""}, ${stats.longPauses} pauses over a second inside answers, ${stats.russianAnswers} answers in Russian, ${stats.typedAnswers} typed.

Return only JSON:
{"bands": {"overall": 5.5, "fluency": 5.5, "lexical": 5.0, "grammar": 5.5},
 "summary": "2-3 sentences in Russian, honest, in character",
 "strengths": ["concrete thing they did well, quoting them", "..."],
 "work": ["concrete thing to improve, with how", "..."],
 "mistakes": [{"wrong": "exact words the student said", "right": "corrected", "why": "short rule in Russian"}],
 "better": [{"original": "one of the student's answers, as said", "improved": "the same idea at band 7+, natural spoken English"}],
 "vocab": [{"en": "word or phrase for this topic", "ru": "перевод", "example": "short example sentence"}],
 "next": ["concrete next step", "..."]}
Limits: strengths 1-3, work 1-3, mistakes 0-8 (real ones only, most important first), better 1-3 (pick the weakest answers that had content), vocab 5-8 (useful for this topic at their level and a bit above), next 2-3.`;
  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: `Topic: ${topicTitle}. Target band: ${s.band}.\n\nTRANSCRIPT\n${transcript}` },
  ];
}

const str = (v: unknown, max = 400) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const band = (v: unknown): Band => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 1 && n <= 9 ? Math.round(n * 2) / 2 : null;
};
const list = <T>(v: unknown, max: number, map: (x: unknown) => T | null): T[] =>
  (Array.isArray(v) ? v : []).map(map).filter((x): x is T => x !== null).slice(0, max);

export function parseReview(raw: string | null, stats?: SpeechStats): LexiReview | null {
  if (!raw) return null;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
  const b = (j.bands ?? {}) as Record<string, unknown>;
  const tooLittle = stats ? stats.englishWords < 40 : false;
  const review: LexiReview = {
    v: 2,
    bands: tooLittle
      ? { overall: null, fluency: null, lexical: null, grammar: null }
      : { overall: band(b.overall), fluency: band(b.fluency), lexical: band(b.lexical), grammar: band(b.grammar) },
    summary: str(j.summary, 600),
    strengths: list(j.strengths, 3, (x) => str(x) || null),
    work: list(j.work, 3, (x) => str(x) || null),
    mistakes: list(j.mistakes, 8, (x) => {
      const m = x as Record<string, unknown>;
      return str(m?.wrong) && str(m?.right) ? { wrong: str(m.wrong, 200), right: str(m.right, 200), why: str(m.why, 200) } : null;
    }),
    better: list(j.better, 3, (x) => {
      const m = x as Record<string, unknown>;
      return str(m?.original) && str(m?.improved) ? { original: str(m.original, 500), improved: str(m.improved, 600) } : null;
    }),
    vocab: list(j.vocab, 8, (x) => {
      const m = x as Record<string, unknown>;
      return str(m?.en) ? { en: str(m.en, 80), ru: str(m.ru, 120), example: str(m.example, 200) } : null;
    }),
    next: list(j.next, 3, (x) => str(x) || null),
  };
  // An overall band that is not near the criteria is a model slip: use their mean instead
  const crit = [review.bands.fluency, review.bands.lexical, review.bands.grammar].filter((x): x is number => x !== null);
  if (crit.length === 3) {
    const mean = Math.round((crit.reduce((a, x) => a + x, 0) / 3) * 2) / 2;
    if (review.bands.overall === null || Math.abs(review.bands.overall - mean) > 0.5) review.bands.overall = mean;
  }
  return review.summary ? review : null;
}
