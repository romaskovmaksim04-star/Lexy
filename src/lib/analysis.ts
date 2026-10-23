// Text analysis for Writing and Speaking practice. This is a rule-based estimate from
// measurable features of the text (length, linking, vocabulary range, sentence variety),
// not an examiner's mark; the UI says so.

import { roundBand } from "./band.ts";
import { checkText, type Issue } from "./grammar.ts";
import { pronunciationBand, type SpeechTiming } from "./speech.ts";

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
  issues: Issue[];
};

const LINKERS = [
  "however", "moreover", "furthermore", "in addition", "therefore", "consequently", "as a result",
  "on the other hand", "in contrast", "nevertheless", "although", "whereas", "while", "despite",
  "in spite of", "for example", "for instance", "such as", "in conclusion", "to conclude",
  "overall", "firstly", "secondly", "finally", "thus", "hence", "similarly", "likewise",
  "in particular", "namely", "even though", "because", "since", "unless", "instead",
  "meanwhile", "otherwise", "in other words", "to sum up", "not only",
  "unfortunately", "also", "alternatively", "in fact", "of course", "as well as", "besides", "particularly",
  "especially", "afterwards", "first", "second", "in the long term", "to begin with", "what is more",
  "as a consequence", "in short", "in summary", "above all", "notably", "by contrast", "rather than", "as a whole",
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
    guiraud: content.length ? unique.size / Math.sqrt(content.length) : 0,
  };
}

function repeatedWords(freq: Map<string, number>, total: number, ignore: Set<string> = new Set()) {
  // Topic words from the task are expected to come back; only other words count as repeats
  const limit = Math.max(5, Math.round(total / 45));
  return [...freq.entries()]
    .filter(([w, c]) => c >= limit && !ignore.has(w))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }));
}

const BASIC_LINKERS = new Set(["first of all", "firstly", "secondly", "first", "second", "on the one hand", "on the other hand", "in addition", "also", "in conclusion", "for example", "because", "but", "so", "finally", "however"]);

export type WritingTask = "task1" | "task2";
/** essay: Task 2; report: Academic Task 1 (a chart); letter: General Training Task 1 */
export type EssayKind = "essay" | "report" | "letter";

const OVERVIEW = /\b(overall|in general|generally speaking|it is (clear|evident|noticeable) that|it can be seen that|in summary|to sum up)\b/;
const COMPARE = /\b(compared (with|to)|whereas|while|by contrast|in contrast|than|respectively|similarly|twice|half|a third|a quarter|the same as)\b/g;
const OPINION = /\b(i (think|believe|feel|would argue)|in my (view|opinion))\b/;
const GREETING = /^\s*dear\b/im;
const CLOSING = /\b(yours (sincerely|faithfully)|best (regards|wishes)|kind regards|warm regards|all the best|regards)\b/i;
const PURPOSE = /\b(i am writing|i'm writing|i am contacting|i would like to (inform|ask|complain|let))\b/i;

export function analyseEssay(text: string, task: WritingTask = "task2", opts: { kind?: EssayKind; prompt?: string } = {}): TextReport {
  const kind: EssayKind = opts.kind ?? (task === "task2" ? "essay" : "report");
  const s = baseStats(text);
  const n = s.words.length;
  const minWords = task === "task2" ? 250 : 150;
  const promptWords = new Set(tokens(opts.prompt ?? "").filter((w) => w.length > 2));
  const repeated = repeatedWords(s.freq, n, promptWords);
  const informal = INFORMAL.filter((w) => countPhrase(s.lower, w) > 0);
  const contractions = (text.match(/\b\w+'(t|re|ve|ll|d|m)\b/gi) ?? []).length;
  // Richness of vocabulary also stands in for how developed the ideas are
  const rich = Math.max(0, Math.min(1.5, (s.guiraud - 6) * 0.6));

  // Task Response / Task Achievement
  const tr: string[] = [];
  let trBand = 5;
  if (n >= minWords) trBand += 0.5;
  else {
    trBand -= n < minWords * 0.7 ? 1.5 : 0.5;
    tr.push(`Меньше ${minWords} слов: на экзамене за это снижают балл.`);
  }
  if (kind === "essay") {
    const hasConclusion = /in conclusion|to conclude|to sum up|in summary|overall,/.test(s.lower);
    const hasPosition = /i (strongly )?(believe|think|agree|disagree|feel|would argue)|in my (view|opinion)|from my perspective|it seems to me/.test(s.lower);
    if (hasPosition) trBand += 0.5;
    else tr.push("Не видно твоей позиции. Скажи прямо: «I believe…» или «In my view…».");
    if (hasConclusion) trBand += 0.5;
    else tr.push("Нет заключения. Закончи абзацем с «In conclusion…».");
    if (s.paragraphs >= 4) trBand += 0.5;
    if (s.paragraphs >= 3 && n / Math.max(1, s.paragraphs) >= 45) trBand += 0.5;
    else tr.push("Идеи мало развиты: в каждом абзаце основной части нужны мысль, объяснение и пример.");
    trBand += rich;
  } else if (kind === "report") {
    const overview = OVERVIEW.test(s.lower);
    const numbers = (text.match(/\d+(?:[.,]\d+)?/g) ?? []).length;
    const compares = (s.lower.match(COMPARE) ?? []).length;
    if (overview) trBand += 1;
    else tr.push("Нет обзора (overview). Без него Task Achievement обычно не выше 5: начни второй абзац с «Overall, …».");
    if (numbers >= 6) trBand += 0.5;
    else tr.push("Мало конкретных цифр из графика. Подкрепляй каждое сравнение данными.");
    if (compares >= 3) trBand += 0.5;
    else tr.push("Сравнивай данные между собой: whereas, compared with, by contrast.");
    if (OPINION.test(s.lower)) {
      trBand -= 0.5;
      tr.push("В Task 1 не нужно своё мнение, только описание данных.");
    }
    trBand += rich;
    if (!overview) trBand = Math.min(trBand, 5.5);
  } else {
    if (GREETING.test(text)) trBand += 0.5;
    else tr.push("Нет обращения. Письмо начинается с «Dear …,».");
    if (CLOSING.test(text)) trBand += 0.5;
    else tr.push("Нет подходящей концовки: «Yours faithfully», «Yours sincerely» или «Best regards».");
    if (PURPOSE.test(text)) trBand += 0.5;
    else tr.push("В начале письма назови цель: «I am writing to…».");
    if (s.paragraphs >= 3) trBand += 0.5;
    else tr.push("Раздели письмо на абзацы: по одному на каждый пункт задания.");
    if (/dear sir or madam/i.test(text) && /yours sincerely/i.test(text)) tr.push("После «Dear Sir or Madam» пиши «Yours faithfully», а не «Yours sincerely».");
    trBand += rich;
  }

  // Coherence & Cohesion
  const cc: string[] = [];
  let ccBand = 5 + Math.min(2.5, s.linkers.length * 0.3);
  const wantParagraphs = kind === "essay" ? 4 : 3;
  if (s.paragraphs >= wantParagraphs) ccBand += 0.5;
  else {
    ccBand -= 1;
    cc.push(`Абзацев: ${s.paragraphs}. Нужно ${wantParagraphs}+: вступление, основная часть, вывод.`);
  }
  if (s.linkers.length < 4) cc.push("Мало связок. Добавь however, moreover, as a result, for instance.");
  // Linking made only of textbook phrases reads as mechanical to an examiner
  const basic = s.linkers.filter((l) => BASIC_LINKERS.has(l)).length;
  if (s.linkers.length >= 4 && basic / s.linkers.length >= 0.7) {
    ccBand = Math.min(ccBand, 7);
    cc.push("Связки шаблонные (on the one hand, first of all, in addition). Добавь разнообразия: nevertheless, by contrast, as a consequence.");
  }

  // Lexical Resource
  const lr: string[] = [];
  // Short Task 1 texts naturally score lower on richness, and reports repeat data words
  let lrBand = 3 + Math.max(0, Math.min(4, (s.guiraud - 4.5) * 1.1)) + Math.min(1.5, s.advanced.length * 0.25) + (task === "task1" ? 0.75 : 0);
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
  const complexRate = s.sentences.length ? s.complex / s.sentences.length : 0;
  let grBand = 5 + Math.min(2, complexRate * 0.8) + Math.min(1, s.spread / 6);
  if (s.avgSentence < 11) {
    grBand -= 0.5;
    gr.push("Предложения короткие. Соединяй мысли через which, although, if.");
  }
  if (s.avgSentence > 32) {
    grBand -= 0.5;
    gr.push("Есть слишком длинные предложения, в них легко ошибиться. Дели их.");
  }
  if (contractions > 0 && kind !== "letter") gr.push(`Сокращения (don't, it's) встречаются ${contractions} раз. В эссе пиши полностью.`);
  const issues = checkText(text, "writing").filter((i) => !(kind === "letter" && (i.rule === "contraction" || i.rule === "informal-lot")));
  const errors = issues.filter((i) => i.kind === "grammar").length;
  const per100 = n ? (errors / n) * 100 : 0;
  if (per100 > 3) { grBand -= 1.5; gr.push(`Много грамматических ошибок: ${errors}. Разбери исправления ниже.`); }
  else if (per100 > 1.5) { grBand -= 1; gr.push(`Грамматических ошибок: ${errors}. Каждая стоит баллов.`); }
  else if (errors > 0) grBand -= 0.5;
  else if (n >= minWords * 0.8) grBand += 0.5;
  const vocabErrors = issues.filter((i) => i.kind === "vocabulary" || i.kind === "spelling").length;
  if (vocabErrors > 2) { lrBand -= 0.5; lr.push(`Ошибки в словах и сочетаниях: ${vocabErrors}.`); }
  else if (vocabErrors > 0) lrBand -= 0.25;

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
    avgSentence: s.avgSentence, linkers: s.linkers, advanced: s.advanced, repeated, criteria, band, tips, issues,
  };
}

export type SpeechReport = TextReport & { wpm: number; fillers: { word: string; count: number }[]; seconds: number; timing?: SpeechTiming };

export function analyseSpeech(transcript: string, seconds: number, t?: SpeechTiming): SpeechReport {
  const s = baseStats(transcript);
  const n = s.words.length;
  const minutes = Math.max(seconds, 1) / 60;
  const wpm = t ? t.wpm : Math.round(n / minutes);
  const fillers = t
    ? [...t.fillers.reduce((m, f) => m.set(f.word, (m.get(f.word) ?? 0) + 1), new Map<string, number>())].map(([word, count]) => ({ word, count }))
    : FILLERS.map((w) => ({ word: w, count: countPhrase(s.lower, w) })).filter((f) => f.count > 0);
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
  if (t) {
    const perMinute = (t.hesitations + t.longPauses * 2) / Math.max(1, t.totalSeconds / 60);
    if (perMinute > 8) { fcBand -= 1; fc.push(`Пауз-колебаний посреди фразы: ${t.hesitations}. Заполняй паузу связкой: «well», «let me think».`); }
    else if (perMinute > 4) { fcBand -= 0.5; fc.push(`Есть паузы посреди фразы (${t.hesitations}). Планируй следующую мысль, пока договариваешь текущую.`); }
    if (t.longPauses) fc.push(`Длинные паузы (2+ секунды): ${t.longPauses}. Экзаменатор это замечает.`);
    if (t.restarts > 3) { fcBand -= 0.5; fc.push(`Повторы и перезапуски фраз: ${t.restarts}.`); }
  }

  const lr: string[] = [];
  let lrBand = 4.5 + s.uniqueRatio * 3.5 + Math.min(1.5, s.advanced.length * 0.3);
  if (repeated.length) { lrBand -= 0.5; lr.push(`Повторяешь: ${repeated.map((r) => r.word).join(", ")}.`); }
  if (s.advanced.length < 2) lr.push("Добавь пару точных слов вместо good/bad/nice.");

  const gr: string[] = [];
  const complexRate = s.sentences.length ? s.complex / s.sentences.length : s.complex / Math.max(1, n / 12);
  const grBand = 5 + Math.min(2, complexRate * 0.9);
  if (complexRate < 0.8) gr.push("Пробуй сложные конструкции: If I had…, which means…, although…");

  const issues = checkText(transcript, "speaking");
  const errors = issues.filter((i) => i.kind === "grammar").length;
  const per100 = n ? (errors / n) * 100 : 0;
  let grAdj = grBand;
  if (per100 > 4) { grAdj -= 1.5; gr.push(`Ошибок в грамматике: ${errors}. Разбери их ниже и произнеси правильно вслух.`); }
  else if (per100 > 2) { grAdj -= 1; gr.push(`Ошибок в грамматике: ${errors}.`); }
  else if (errors > 0) grAdj -= 0.5;

  const criteria: Criterion[] = [
    { key: "fc", title: "Fluency & Coherence", band: clamp(fcBand), notes: fc },
    { key: "lr", title: "Lexical Resource", band: clamp(lrBand), notes: lr },
    { key: "gr", title: "Grammatical Range & Accuracy", band: clamp(grAdj), notes: gr },
  ];
  if (t) {
    const pr = pronunciationBand(t, n);
    criteria.push({ key: "pr", title: "Pronunciation", band: clamp(pr.band), notes: pr.notes });
  }
  const band = n < 8 ? 0 : roundBand(criteria.reduce((a, c) => a + c.band, 0) / criteria.length);
  return {
    words: n, sentences: s.sentences.length, paragraphs: s.paragraphs, uniqueRatio: s.uniqueRatio,
    avgSentence: s.avgSentence, linkers: s.linkers, advanced: s.advanced, repeated, criteria, band,
    tips: criteria.flatMap((c) => c.notes).slice(0, 4), wpm, fillers, seconds, timing: t, issues,
  };
}
