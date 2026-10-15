// Text analysis for Writing and Speaking practice. This is a rule-based estimate from
// measurable features of the text (length, linking, vocabulary range, sentence variety),
// not an examiner's mark; the UI says so.

import { roundBand } from "./band.ts";

export type Criterion = { key: string; title: string; band: number; notes: string[] };
export type TextReport = {
  words: number;
  sentences: number;
  paragraphs: number;
  uniqueRatio: number;
  avgSentence: number;
  linkers: string[];
  advanced: string[];
  repeated: { word: string; count: number }[];
  criteria: Criterion[];
  band: number;
  tips: string[];
};

const LINKERS = [
  "however", "moreover", "furthermore", "in addition", "therefore", "consequently", "as a result",
  "on the other hand", "in contrast", "nevertheless", "although", "whereas", "while", "despite",
  "in spite of", "for example", "for instance", "such as", "in conclusion", "to conclude",
  "overall", "firstly", "secondly", "finally", "thus", "hence", "similarly", "likewise",
  "in particular", "namely", "even though", "because", "since", "unless", "instead",
  "meanwhile", "otherwise", "in other words", "to sum up", "not only",
];

// Less common words that examiners notice when used naturally
const ADVANCED = [
  "significant", "substantial", "considerable", "crucial", "essential", "inevitable", "detrimental",
  "beneficial", "enhance", "undermine", "facilitate", "alleviate", "exacerbate", "mitigate",
  "perspective", "consequence", "implication", "phenomenon", "tendency", "approach", "strategy",
  "sustainable", "efficient", "affordable", "vulnerable", "contemporary", "fundamental",
  "acquire", "allocate", "advocate", "comprise", "contribute", "emphasise", "emphasize", "ensure",
  "establish", "foster", "generate", "highlight", "implement", "maintain", "prioritise", "prioritize",
  "promote", "pursue", "reinforce", "restrict", "sufficient", "widespread", "notably", "arguably",
  "predominantly", "particularly", "increasingly", "potentially", "ultimately", "drawback",
  "advantage", "disadvantage", "outweigh", "burden", "incentive", "initiative", "legislation",
  "infrastructure", "urbanisation", "urbanization", "globalisation", "globalization", "wellbeing",
];

const COMPLEX_MARKERS = [
  "which", "who", "whom", "whose", "that", "if", "unless", "although", "though", "whereas",
  "while", "because", "since", "would", "could", "might", "had", "been", "being",
];

const INFORMAL = ["gonna", "wanna", "kinda", "stuff", "things", "kids", "a lot of", "lots of", "pretty", "really", "very", "ok", "okay"];
const FILLERS = ["um", "uh", "erm", "er", "hmm", "like", "you know", "i mean", "basically", "actually", "sort of", "kind of"];

const STOP = new Set(
  "the a an and or but of to in on at for with is are was were be been being it this that these those as by from his her their our your my we you they he she i not no do does did have has had can will would should could may might than then there here which who what when where why how all any some more most such so if into about also its it's".split(" "),
);

function tokens(text: string): string[] {
  return (text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? []);
}

function countPhrase(lower: string, phrase: string): number {
  const re = new RegExp(`(^|[^a-z])${phrase.replace(/ /g, "\\s+")}(?=[^a-z]|$)`, "g");
  return (lower.match(re) ?? []).length;
}

function clamp(v: number, lo = 4, hi = 8.5): number {
  return Math.max(lo, Math.min(hi, roundBand(v)));
}

function baseStats(text: string) {
  const lower = text.toLowerCase();
  const words = tokens(text);
  const sentences = text.split(/[.!?]+(?:\s|$)/).map((s) => s.trim()).filter((s) => tokens(s).length > 2);
  const paragraphs = text.split(/\n\s*\n|\n/).map((p) => p.trim()).filter((p) => tokens(p).length > 5).length;
  const content = words.filter((w) => !STOP.has(w) && w.length > 2);
  const unique = new Set(content);
  const freq = new Map<string, number>();
  for (const w of content) freq.set(w, (freq.get(w) ?? 0) + 1);
  const linkers = LINKERS.filter((l) => countPhrase(lower, l) > 0);
  const advanced = [...new Set(words.filter((w) => ADVANCED.includes(w)))];
  const lengths = sentences.map((s) => tokens(s).length);
  const avgSentence = lengths.length ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;
  const variance = lengths.length ? lengths.reduce((a, b) => a + (b - avgSentence) ** 2, 0) / lengths.length : 0;
  const complex = words.filter((w) => COMPLEX_MARKERS.includes(w)).length;
  return {
    lower, words, sentences, paragraphs, content, unique, freq, linkers, advanced, lengths,
    avgSentence, spread: Math.sqrt(variance), complex,
    uniqueRatio: content.length ? unique.size / content.length : 0,
  };
}

function repeatedWords(freq: Map<string, number>, total: number) {
  const limit = Math.max(4, Math.round(total / 60));
  return [...freq.entries()]
    .filter(([, c]) => c >= limit)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }));
}

export type WritingTask = "task1" | "task2";

export function analyseEssay(text: string, task: WritingTask = "task2"): TextReport {
  const s = baseStats(text);
  const n = s.words.length;
  const minWords = task === "task2" ? 250 : 150;
  const repeated = repeatedWords(s.freq, n);
  const informal = INFORMAL.filter((w) => countPhrase(s.lower, w) > 0);
  const contractions = (text.match(/\b\w+'(t|re|ve|ll|d|m)\b/gi) ?? []).length;
  const hasConclusion = /in conclusion|to conclude|to sum up|overall|in summary/.test(s.lower);
  const hasPosition = /i (strongly )?(believe|think|agree|disagree|feel|would argue)|in my (view|opinion)|from my perspective/.test(s.lower);

  // Task Response
  const tr: string[] = [];
  let trBand = 7;
  if (n < minWords) {
    trBand -= n < minWords * 0.7 ? 2 : 1;
    tr.push(`Меньше ${minWords} слов: на экзамене за это снижают балл.`);
  }
  if (task === "task2" && !hasPosition) {
    trBand -= 0.5;
    tr.push("Не видно твоей позиции. Скажи прямо: «I believe…» или «In my view…».");
  }
  if (!hasConclusion && task === "task2") {
    trBand -= 0.5;
    tr.push("Нет заключения. Закончи абзацем с «In conclusion…».");
  }
  if (n >= minWords && hasPosition && hasConclusion) trBand += 0.5;

  // Coherence & Cohesion
  const cc: string[] = [];
  let ccBand = 5 + Math.min(2.5, s.linkers.length * 0.35);
  const wantParagraphs = task === "task2" ? 4 : 3;
  if (s.paragraphs < wantParagraphs) {
    ccBand -= 1;
    cc.push(`Абзацев: ${s.paragraphs}. Нужно ${wantParagraphs}+: вступление, основная часть, вывод.`);
  }
  if (s.linkers.length < 4) cc.push("Мало связок. Добавь however, moreover, as a result, for instance.");

  // Lexical Resource
  const lr: string[] = [];
  let lrBand = 3.5 + s.uniqueRatio * 4 + Math.min(1.5, s.advanced.length * 0.25);
  if (repeated.length) {
    lrBand -= 0.5;
    lr.push(`Повторы: ${repeated.map((r) => `${r.word} ×${r.count}`).join(", ")}. Найди синонимы.`);
  }
  if (informal.length) {
    lrBand -= 0.5;
    lr.push(`Разговорные слова: ${informal.join(", ")}. В эссе лучше нейтральная лексика.`);
  }
  if (s.advanced.length < 3) lr.push("Добавь точной академической лексики: significant, contribute, ensure.");

  // Grammatical Range & Accuracy
  const gr: string[] = [];
  const complexRate = n ? s.complex / s.sentences.length : 0;
  let grBand = 5 + Math.min(1.5, complexRate * 0.8) + Math.min(1, s.spread / 6);
  if (s.avgSentence < 11) {
    grBand -= 0.5;
    gr.push("Предложения короткие. Соединяй мысли через which, although, if.");
  }
  if (s.avgSentence > 32) {
    grBand -= 0.5;
    gr.push("Есть слишком длинные предложения, в них легко ошибиться. Дели их.");
  }
  if (contractions > 0) gr.push(`Сокращения (don't, it's) встречаются ${contractions} раз. В эссе пиши полностью.`);

  const criteria: Criterion[] = [
    { key: "tr", title: task === "task2" ? "Task Response" : "Task Achievement", band: clamp(trBand), notes: tr },
    { key: "cc", title: "Coherence & Cohesion", band: clamp(ccBand), notes: cc },
    { key: "lr", title: "Lexical Resource", band: clamp(lrBand), notes: lr },
    { key: "gr", title: "Grammatical Range", band: clamp(grBand), notes: gr },
  ];
  const band = n < 20 ? 0 : roundBand(criteria.reduce((a, c) => a + c.band, 0) / 4);
  const tips = criteria.flatMap((c) => c.notes).slice(0, 4);
  return {
    words: n, sentences: s.sentences.length, paragraphs: s.paragraphs, uniqueRatio: s.uniqueRatio,
    avgSentence: s.avgSentence, linkers: s.linkers, advanced: s.advanced, repeated, criteria, band, tips,
  };
}

export type SpeechReport = TextReport & { wpm: number; fillers: { word: string; count: number }[]; seconds: number };

export function analyseSpeech(transcript: string, seconds: number): SpeechReport {
  const s = baseStats(transcript);
  const n = s.words.length;
  const minutes = Math.max(seconds, 1) / 60;
  const wpm = Math.round(n / minutes);
  const fillers = FILLERS.map((w) => ({ word: w, count: countPhrase(s.lower, w) })).filter((f) => f.count > 0);
  const fillerCount = fillers.reduce((a, f) => a + f.count, 0);
  const fillerRate = n ? fillerCount / n : 0;
  const repeated = repeatedWords(s.freq, n);

  const fc: string[] = [];
  let fcBand = 6;
  if (wpm < 80) { fcBand -= 1.5; fc.push(`Темп ${wpm} слов/мин. Это медленно, цель 110-150.`); }
  else if (wpm < 105) { fcBand -= 0.5; fc.push(`Темп ${wpm} слов/мин, можно чуть живее.`); }
  else if (wpm <= 170) fcBand += 1;
  if (fillerRate > 0.06) { fcBand -= 1; fc.push(`Много слов-паразитов (${fillerCount}). Делай короткую паузу вместо «um».`); }
  if (s.linkers.length >= 3) fcBand += 0.5; else fc.push("Связывай мысли: because, so, for example, on the other hand.");
  if (seconds < 20) { fcBand -= 1; fc.push("Ответ слишком короткий. Развивай мысль: ответ, причина, пример."); }

  const lr: string[] = [];
  let lrBand = 4.5 + s.uniqueRatio * 3.5 + Math.min(1.5, s.advanced.length * 0.3);
  if (repeated.length) { lrBand -= 0.5; lr.push(`Повторяешь: ${repeated.map((r) => r.word).join(", ")}.`); }
  if (s.advanced.length < 2) lr.push("Добавь пару точных слов вместо good/bad/nice.");

  const gr: string[] = [];
  const complexRate = s.sentences.length ? s.complex / s.sentences.length : s.complex / Math.max(1, n / 12);
  const grBand = 5 + Math.min(2, complexRate * 0.9);
  if (complexRate < 0.8) gr.push("Пробуй сложные конструкции: If I had…, which means…, although…");

  const criteria: Criterion[] = [
    { key: "fc", title: "Fluency & Coherence", band: clamp(fcBand), notes: fc },
    { key: "lr", title: "Lexical Resource", band: clamp(lrBand), notes: lr },
    { key: "gr", title: "Grammatical Range", band: clamp(grBand), notes: gr },
  ];
  const band = n < 8 ? 0 : roundBand(criteria.reduce((a, c) => a + c.band, 0) / 3);
  return {
    words: n, sentences: s.sentences.length, paragraphs: s.paragraphs, uniqueRatio: s.uniqueRatio,
    avgSentence: s.avgSentence, linkers: s.linkers, advanced: s.advanced, repeated, criteria, band,
    tips: criteria.flatMap((c) => c.notes).slice(0, 4), wpm, fillers, seconds,
  };
}
