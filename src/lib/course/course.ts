// The English course: a lesson is a run of steps built from Maks's lesson data, a level test
// mixes the whole level. Pure functions, so pages, actions and tests share them.

import { LESSONS, READINGS } from "./data.ts";
import { LEVELS, type Level, type Mcq } from "./types.ts";

export const LESSONS_PER_LEVEL = 30;
/** Share of right answers that counts a lesson as done and a level test as passed. */
export const PASS = 0.7;
export const LEVEL_PASS = 0.85;

export type Step =
  | { kind: "theory"; title: string; text: string; examples: string[] }
  | { kind: "quiz"; title: string; questions: Mcq[] }
  | { kind: "order"; sentence: string }
  | { kind: "typing"; items: { w: string; a: string }[] }
  | { kind: "match"; pairs: [string, string][] }
  | { kind: "reading"; title: string; passage: string; questions: Mcq[] }
  | { kind: "listening"; script: string; questions: Mcq[] };

export function isLevel(v: string): v is Level {
  return (LEVELS as readonly string[]).includes(v);
}

export function lessonAt(level: Level, n: number) {
  return LESSONS[level][n - 1];
}

export function wordQuestions(ws: { w: string; o: string[]; a: number }[]): Mcq[] {
  return ws.map((x) => ({ q: `Как переводится «${x.w}»?`, o: x.o, a: x.a }));
}

export function lessonSteps(level: Level, n: number): Step[] {
  const l = lessonAt(level, n);
  if (!l) return [];
  const words = wordQuestions(l.ws);
  // The longest example makes the best sentence to put back together
  const sentence = [...l.th.ex].sort((a, b) => b.split(" ").length - a.split(" ").length)[0] ?? "I like English.";
  const r = READINGS[level][(n - 1) % READINGS[level].length];
  const steps: Step[] = [
    { kind: "theory", title: l.t, text: l.th.e, examples: l.th.ex },
    { kind: "quiz", title: "Грамматика", questions: l.gr },
    { kind: "order", sentence },
    { kind: "quiz", title: "Слова", questions: words },
    { kind: "typing", items: l.ws.slice(0, 3).map((x) => ({ w: x.w, a: x.o[x.a] })) },
    { kind: "match", pairs: l.ws.slice(0, 5).map((x) => [x.w, x.o[x.a]] as [string, string]) },
  ];
  // Reading texts come every fifth lesson so they don't repeat within a level
  if (n % 5 === 0 && r) steps.push({ kind: "reading", title: r.t, passage: r.p, questions: r.q });
  steps.push({ kind: "listening", script: l.li.script, questions: l.li.q });
  steps.push({ kind: "quiz", title: "Повторение", questions: [...l.gr.slice(0, 2), ...words.slice(0, 2)] });
  return steps;
}

/** 12 questions spread over the whole level plus one listening with its questions. */
export function levelTest(level: Level): { questions: Mcq[]; listen: { script: string; questions: Mcq[] } } {
  const ls = LESSONS[level];
  const pool = ls.flatMap((l) => [...l.gr, ...wordQuestions(l.ws)]);
  const questions = Array.from({ length: 12 }, (_, i) => pool[Math.floor((i * pool.length) / 12)]);
  const mid = ls[Math.floor(ls.length / 2)];
  return { questions, listen: { script: mid.li.script, questions: mid.li.q } };
}

export function nextLevel(level: Level): Level | null {
  return LEVELS[LEVELS.indexOf(level) + 1] ?? null;
}

/** Scores answers (option indexes) against questions; missing answers count as wrong. */
export function score(questions: Mcq[], answers: (number | null | undefined)[]): { right: number; total: number } {
  return { right: questions.filter((q, i) => answers[i] === q.a).length, total: questions.length };
}

/** All voiced text of a lesson: the listening script and the theory examples. */
export function lessonVoice(level: Level, n: number): string[] {
  const l = lessonAt(level, n);
  return l ? [l.li.script, ...l.th.ex] : [];
}
