export const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
export type Level = (typeof LEVELS)[number];

/** A multiple-choice question: `a` is the index of the right option. */
export type Mcq = { q: string; o: string[]; a: number };

export type Lesson = {
  t: string; // title
  th: { e: string; ex: string[] }; // explanation and examples
  gr: Mcq[]; // grammar
  ws: { w: string; o: string[]; a: number }[]; // words: pick the translation
  li: { script: string; q: Mcq[] }; // listening: voiced script and questions
};

export type CourseReading = { t: string; p: string; q: Mcq[] };
