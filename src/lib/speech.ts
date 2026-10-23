// Fluency and pronunciation signals from a timed transcript (Whisper words with
// start/end times and recognition confidence). Confidence is a proxy for how clearly a
// word was pronounced: a word the recogniser was unsure about is one a listener might
// stumble on too. The UI presents these as estimates.

export type TimedWord = { w: string; s: number; e: number; p: number };

export type Pause = { at: number; seconds: number; after: string; kind: "natural" | "hesitation" | "long" };
export type Flagged = { word: string; at: number; confidence: number };

export type SpeechTiming = {
  /** Words per minute over the whole answer, pauses included */
  wpm: number;
  /** Words per minute while actually speaking */
  articulation: number;
  speakingSeconds: number;
  totalSeconds: number;
  pauses: Pause[];
  hesitations: number;
  longPauses: number;
  fillers: { word: string; at: number }[];
  unclear: Flagged[];
  /** Mean recognition confidence, 0..1 */
  clarity: number;
  /** Words repeated back to back ("I I think") */
  restarts: number;
};

const FILLER_WORDS = new Set(["um", "umm", "uh", "uhh", "er", "erm", "ah", "hmm", "mm", "eh"]);
const SOFT_FILLERS = ["like", "you know", "i mean", "basically", "actually", "sort of", "kind of"];

const clean = (w: string) => w.toLowerCase().replace(/[^a-z']/g, "");

export function timing(words: TimedWord[], duration?: number): SpeechTiming {
  const list = words.filter((w) => clean(w.w));
  const total = Math.max(duration ?? 0, list.length ? list[list.length - 1].e : 0, 1);
  const pauses: Pause[] = [];
  const fillers: { word: string; at: number }[] = [];
  const unclear: Flagged[] = [];
  let speaking = 0;
  let restarts = 0;
  let confSum = 0;
  let confN = 0;

  list.forEach((w, i) => {
    const word = clean(w.w);
    speaking += Math.max(0, w.e - w.s);
    if (FILLER_WORDS.has(word)) fillers.push({ word, at: w.s });
    else {
      confSum += w.p;
      confN += 1;
      if (w.p < 0.45 && word.length > 2) unclear.push({ word: w.w.replace(/[^\w'-]/g, ""), at: w.s, confidence: w.p });
    }
    const prev = list[i - 1];
    if (prev) {
      if (clean(prev.w) === word && !FILLER_WORDS.has(word) && word.length > 0) restarts += 1;
      const gap = w.s - prev.e;
      if (gap >= 0.5) {
        // A pause after a sentence or a comma is natural; in the middle of a clause it reads as hesitation
        const boundary = /[.,!?;:]$/.test(prev.w.trim());
        const kind: Pause["kind"] = gap >= 2 ? "long" : boundary ? "natural" : "hesitation";
        pauses.push({ at: prev.e, seconds: Math.round(gap * 10) / 10, after: prev.w.trim(), kind });
      }
    }
  });

  // Multi-word soft fillers counted from the joined text
  const text = ` ${list.map((w) => clean(w.w)).join(" ")} `;
  for (const f of SOFT_FILLERS) {
    const n = text.split(` ${f} `).length - 1;
    // "like" is a filler only when it is frequent; one "like" is usually a verb
    const real = f === "like" ? Math.max(0, n - 2) : n;
    for (let k = 0; k < real; k++) fillers.push({ word: f, at: -1 });
  }

  const content = list.filter((w) => !FILLER_WORDS.has(clean(w.w))).length;
  return {
    wpm: Math.round((content / total) * 60),
    articulation: Math.round((content / Math.max(speaking, 1)) * 60),
    speakingSeconds: Math.round(speaking),
    totalSeconds: Math.round(total),
    pauses,
    hesitations: pauses.filter((p) => p.kind === "hesitation").length,
    longPauses: pauses.filter((p) => p.kind === "long").length,
    fillers,
    unclear: unclear.slice(0, 20),
    clarity: confN ? confSum / confN : 0,
    restarts,
  };
}

/** Pronunciation band estimate from clarity and the share of unclear words. */
export function pronunciationBand(t: SpeechTiming, words: number): { band: number; notes: string[] } {
  const notes: string[] = [];
  const unclearShare = words ? t.unclear.length / words : 0;
  // 0.92+ mean confidence reads as very clear speech, 0.7 as frequently hard to follow
  let band = 4 + Math.max(0, Math.min(1, (t.clarity - 0.62) / 0.32)) * 4.5;
  if (unclearShare > 0.12) band -= 1;
  else if (unclearShare > 0.06) band -= 0.5;
  if (t.unclear.length) {
    notes.push(`Нечётко прозвучали: ${t.unclear.slice(0, 6).map((u) => u.word).join(", ")}. Послушай эталон и повтори.`);
  }
  if (t.articulation > 190) {
    band -= 0.5;
    notes.push("Говоришь очень быстро, звуки «съедаются». Замедлись на ключевых словах.");
  }
  if (!notes.length) notes.push("Речь звучит разборчиво. Работай над интонацией: выделяй голосом главное слово фразы.");
  return { band: Math.max(4, Math.min(8.5, Math.round(band * 2) / 2)), notes };
}
