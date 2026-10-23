// Preppy's conversation engine without a language model: it asks questions from a topic,
// asks one follow-up built from what the user said, recasts the first mistake it finds,
// and writes a review at the end. Pure functions, so the server can replay any state.

import { checkText, type Issue } from "../grammar.ts";
import { analyseSpeech } from "../analysis.ts";
import { persona, type PersonaId } from "./personas.ts";
import { topic as topicById, customTopic } from "./topics.ts";

export type Fix = { wrong: string; right: string; why: string };

export type Turn = {
  role: "preppy" | "user";
  text: string;
  fix?: Fix;
  words?: number;
  seconds?: number;
  mood?: string; // Lexi's mood for this line
  interrupted?: boolean; // the student talked over this line of Lexi's
  typed?: boolean; // the student typed instead of speaking
  pauses?: number; // pauses longer than a second inside the answer (from the microphone)
  alt?: string; // the recogniser's other reading of the same speech, when it was unsure
};

export type EngineState = {
  topic: string;
  topicTitle?: string; // for a topic the student typed in
  q: number; // index of the current main question
  followed: boolean; // a follow-up was already asked for this question
  turns: number; // user turns so far
  seed: number;
};

const MAX_TURNS = 10;

const GENERIC_FOLLOW = [
  "Why do you think that is?",
  "Can you give me an example?",
  "How did that make you feel?",
  "Has that changed over the years?",
  "What would you do differently?",
  "Do your friends feel the same way?",
];

const LINK = /\b(because|so|however|although|for example|for instance|on the other hand|that's why|which|actually|moreover|but)\b/gi;

function pick<T>(list: T[], seed: number, salt: number): T {
  const x = Math.abs(Math.sin(seed * 9301 + salt * 49297) * 233280);
  return list[Math.floor(x) % list.length];
}

function wordCount(text: string): number {
  return (text.match(/[A-Za-z']+/g) ?? []).length;
}

const PEOPLE = "best friend|friend|friends|sister|brother|mother|mum|mom|father|dad|family|parents|grandmother|grandma|grandfather|grandpa|teacher|boss|colleagues|dog|cat|girlfriend|boyfriend|wife|husband|son|daughter|cousin";
const PLACES = "city|town|village|university|school|job|office|room|flat|apartment|house|country|neighbourhood";

/** A follow-up question built from something the user actually said, or null. */
export function hookQuestion(text: string, seed: number): string | null {
  const person = text.match(new RegExp(`\\bmy\\s+(?:best\\s+|old\\s+|little\\s+|older\\s+|younger\\s+)?(${PEOPLE})\\b`, "i"));
  if (person) {
    const who = person[0].replace(/^my\s+/i, "");
    return pick([`Tell me more about your ${who}.`, `What is your ${who} like?`, `How often do you see your ${who}?`], seed, 1);
  }
  const place = text.match(new RegExp(`\\bmy\\s+(${PLACES})\\b`, "i"));
  if (place) return pick([`What do you like most about your ${place[1]}?`, `Would you change anything about your ${place[1]}?`], seed, 2);

  // Names of things: capitalised words that do not start a sentence
  const names: string[] = [];
  const re = /\b([A-Z][a-z]{2,}(?:\s[A-Z][a-z]+)?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const before = text.slice(0, m.index).trimEnd();
    if (!before || /[.!?]$/.test(before)) continue; // first word of a sentence
    if (!["English", "Okay", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].includes(m[1])) names.push(m[1]);
  }
  if (names.length) return pick([`You mentioned ${names[0]}. What is special about it?`, `${names[0]}, interesting. Why that one?`], seed, 3);

  if (/\bbecause\b/i.test(text)) return pick(["Is that the main reason, or are there others?", "Interesting reason. Has it always been like that?"], seed, 4);
  return null;
}

function firstFix(text: string): Fix | undefined {
  const issue: Issue | undefined = checkText(text, "speaking").find((i) => i.kind === "grammar" || i.kind === "vocabulary");
  return issue ? { wrong: issue.original, right: issue.fix, why: issue.why } : undefined;
}

function topicOf(id: string, title?: string) {
  return id === "custom" && title ? customTopic(title) : topicById(id);
}

export function start(personaId: PersonaId, topicId: string, seed = Date.now() % 100000, title?: string): { state: EngineState; reply: string } {
  const p = persona(personaId);
  const t = topicOf(topicId, title);
  const state: EngineState = { topic: t.id, topicTitle: t.custom ? t.title : undefined, q: 0, followed: false, turns: 0, seed };
  return { state, reply: `${pick(p.hello, seed, 0)} ${t.opener} ${t.questions[0]}` };
}

export function respond(
  state: EngineState,
  personaId: PersonaId,
  answer: string,
): { state: EngineState; reply: string; fix?: Fix; done: boolean } {
  const p = persona(personaId);
  const t = topicOf(state.topic, state.topicTitle);
  const words = wordCount(answer);
  const links = (answer.match(LINK) ?? []).length;
  const turn = state.turns + 1;
  const salt = turn * 7;
  const fix = words >= 3 ? firstFix(answer) : undefined;
  const fixLine = fix ? pick(p.fix, state.seed, salt + 1).replace("{wrong}", fix.wrong).replace("{right}", fix.right) : "";

  const next = { ...state, turns: turn };
  const lastQuestion = state.q >= t.questions.length - 1;

  // Too short: ask to expand, once per question
  if (words < 6 && !state.followed) {
    next.followed = true;
    return { state: next, reply: [pick(p.short, state.seed, salt), fixLine].filter(Boolean).join(" "), fix, done: false };
  }

  const reaction = words >= 40 && links >= 1 ? pick(p.great, state.seed, salt) : pick(p.good, state.seed, salt);

  if (turn >= MAX_TURNS || (lastQuestion && state.followed)) {
    return { state: next, reply: [reaction, fixLine, pick(p.bye, state.seed, salt + 2)].filter(Boolean).join(" "), fix, done: true };
  }

  if (!state.followed && words >= 6) {
    const hook = hookQuestion(answer, state.seed + turn);
    const follow = hook ?? (pick([0, 1, 2], state.seed, salt + 3) === 0 ? pick(GENERIC_FOLLOW, state.seed, salt + 4) : null);
    if (follow) {
      next.followed = true;
      return { state: next, reply: [reaction, fixLine, follow].filter(Boolean).join(" "), fix, done: false };
    }
  }

  if (lastQuestion) {
    return { state: next, reply: [reaction, fixLine, pick(p.bye, state.seed, salt + 2)].filter(Boolean).join(" "), fix, done: true };
  }

  next.q = state.q + 1;
  next.followed = false;
  return {
    state: next,
    reply: [reaction, fixLine, pick(p.next, state.seed, salt + 5), t.questions[next.q]].filter(Boolean).join(" "),
    fix,
    done: false,
  };
}

// Plain words that have a stronger alternative an examiner would notice
const UPGRADES: Record<string, string[]> = {
  good: ["beneficial", "rewarding", "valuable"],
  bad: ["harmful", "unpleasant", "disappointing"],
  very: ["extremely", "remarkably", "incredibly"],
  big: ["significant", "considerable", "huge"],
  nice: ["pleasant", "enjoyable", "delightful"],
  interesting: ["fascinating", "intriguing", "engaging"],
  important: ["essential", "crucial", "vital"],
  think: ["believe", "reckon", "would argue"],
  like: ["enjoy", "be keen on", "be fond of"],
  many: ["numerous", "a great number of", "plenty of"],
  thing: ["aspect", "issue", "factor"],
  happy: ["delighted", "content", "thrilled"],
  hard: ["challenging", "demanding", "tough"],
  boring: ["dull", "tedious", "monotonous"],
  beautiful: ["stunning", "picturesque", "gorgeous"],
};

export type Review = {
  turns: number;
  words: number;
  unique: number;
  seconds: number;
  sentences: number;
  band: number;
  wentWell: string[];
  toWork: string[];
  fixes: Fix[];
  upgrades: { word: string; count: number; options: string[] }[];
  topicWords: string[];
};

export function review(turns: Turn[], topicId: string, title?: string): Review {
  const user = turns.filter((t) => t.role === "user");
  const text = user.map((t) => t.text).join(" ");
  const seconds = user.reduce((a, t) => a + (t.seconds ?? 0), 0);
  const report = analyseSpeech(text, Math.max(seconds, 1));
  const all = (text.toLowerCase().match(/[a-z']+/g) ?? []);
  const unique = new Set(all).size;
  const fixes: Fix[] = [];
  const seen = new Set<string>();
  for (const i of report.issues) {
    if (seen.has(i.original.toLowerCase())) continue;
    seen.add(i.original.toLowerCase());
    fixes.push({ wrong: i.original, right: i.fix, why: i.why });
  }
  const counts = new Map<string, number>();
  for (const w of all) if (UPGRADES[w]) counts.set(w, (counts.get(w) ?? 0) + 1);
  const upgrades = [...counts.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([word, count]) => ({ word, count, options: UPGRADES[word] }));

  const avg = user.length ? report.words / user.length : 0;
  const wentWell: string[] = [];
  const toWork: string[] = [];
  if (avg >= 25) wentWell.push("Развёрнутые ответы: в среднем " + Math.round(avg) + " слов на ответ.");
  else toWork.push("Ответы короткие (в среднем " + Math.round(avg) + " слов). Схема на каждый ответ: мысль, причина, пример.");
  if (report.linkers.length >= 3) wentWell.push(`Связываешь мысли: ${report.linkers.slice(0, 4).join(", ")}.`);
  else toWork.push("Мало связок. Добавляй because, for example, on the other hand.");
  if (report.advanced.length >= 2) wentWell.push(`Сильная лексика: ${report.advanced.slice(0, 4).join(", ")}.`);
  if (fixes.length === 0 && report.words > 40) wentWell.push("Не нашла типичных грамматических ошибок.");
  if (fixes.length) toWork.push(`Ошибок, которые стоит закрепить: ${fixes.length}. Они ниже, произнеси исправленный вариант вслух.`);
  if (upgrades.length) toWork.push(`Повторяешь простые слова: ${upgrades.map((u) => u.word).join(", ")}. Попробуй замены.`);
  if (!wentWell.length) wentWell.push("Ты дошёл(ла) до конца разговора, это уже практика вслух.");

  return {
    turns: user.length,
    words: report.words,
    unique,
    seconds,
    sentences: report.sentences,
    band: report.band,
    wentWell,
    toWork,
    fixes: fixes.slice(0, 8),
    upgrades,
    topicWords: topicOf(topicId, title).words,
  };
}
