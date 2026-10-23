// Versions of tests that are safe to send to the browser: no answers, no explanations.
import type { QuestionGroup } from "./types.ts";

export function stripAnswers(groups: QuestionGroup[]): QuestionGroup[] {
  return groups.map((g) => ({ ...g, questions: g.questions.map((q) => ({ ...q, answer: [], why: "" })) }));
}
