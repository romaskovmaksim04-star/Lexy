import { test } from "node:test";
import assert from "node:assert/strict";
import { analyseEssay, type EssayKind } from "./analysis.ts";
import { WRITING } from "./content/prompts.ts";
import { MIDDLE_ESSAY, WEAK_ESSAY, WEAK_REPORT } from "./calibration.ts";

const kindOf = (w: (typeof WRITING)[number]): EssayKind => (w.task === "task2" ? "essay" : w.format === "general" ? "letter" : "report");

test("model answers score Band 7 or higher", () => {
  for (const w of WRITING) {
    assert.ok(w.model, `${w.id} has no model answer`);
    const r = analyseEssay(w.model!, w.task, { kind: kindOf(w), prompt: w.text });
    assert.ok(r.band >= 7, `${w.id}: model scored ${r.band}`);
  }
});

test("a typical middle essay lands around Band 6-7", () => {
  const r = analyseEssay(MIDDLE_ESSAY, "task2", { prompt: WRITING[0].text });
  assert.ok(r.band >= 6 && r.band <= 7, `middle scored ${r.band}`);
});

test("a weak essay and a weak report score Band 5 or lower", () => {
  assert.ok(analyseEssay(WEAK_ESSAY, "task2", { prompt: WRITING[0].text }).band <= 5);
  assert.ok(analyseEssay(WEAK_REPORT, "task1", { kind: "report" }).band <= 5);
});

test("a report without an overview is capped and told why", () => {
  const net = WRITING.find((w) => w.id === "w-internet-age")!;
  const noOverview = net.model!.replace(/Overall, [^.]*\.\s*/, "");
  const r = analyseEssay(noOverview, "task1", { kind: "report", prompt: net.text });
  const ta = r.criteria.find((c) => c.key === "tr")!;
  assert.ok(ta.band <= 5.5);
  assert.ok(ta.notes.some((n) => n.includes("overview")));
});

test("letters are checked for greeting and closing", () => {
  const r = analyseEssay("I want to say that the course was bad and the teacher was not good at all. I want my money back because I paid a lot for it and I did not learn anything useful during the course.", "task1", { kind: "letter" });
  const ta = r.criteria.find((c) => c.key === "tr")!;
  assert.ok(ta.notes.some((n) => n.includes("Dear")));
  assert.ok(ta.notes.some((n) => n.includes("Yours")));
});
