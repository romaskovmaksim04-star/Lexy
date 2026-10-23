export type QuestionKind = "tfng" | "ynng" | "mcq" | "gap";

export type Question = {
  id: string;
  kind: QuestionKind;
  prompt: string;
  options?: string[];
  /** Accepted answers, compared case-insensitively after trimming. */
  answer: string[];
  /** Short explanation shown after checking, in Russian. */
  why: string;
};

export type QuestionGroup = {
  title: string;
  instructions: string;
  questions: Question[];
};

export type ReadingTest = {
  id: string;
  title: string;
  format: "academic" | "general";
  minutes: number;
  topic: string;
  passage: { heading: string; paragraphs: string[] };
  groups: QuestionGroup[];
};

export type ListeningLine = { speaker: "A" | "B"; text: string };

export type ListeningTest = {
  id: string;
  title: string;
  part: number;
  context: string;
  speakers: Record<"A" | "B", { name: string; voice: "female" | "male" | "female2" | "male2" }>;
  script: ListeningLine[];
  groups: QuestionGroup[];
};

export function normalise(answer: string): string {
  return answer.trim().toLowerCase().replace(/[.,!?;:"']/g, "").replace(/\s+/g, " ");
}

export function isCorrect(q: Question, given: string | undefined): boolean {
  if (!given) return false;
  const g = normalise(given);
  return q.answer.some((a) => normalise(a) === g);
}

export function allQuestions(groups: QuestionGroup[]): Question[] {
  return groups.flatMap((g) => g.questions);
}
