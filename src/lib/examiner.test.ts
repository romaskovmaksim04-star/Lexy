import { test } from "node:test";
import assert from "node:assert/strict";
import { criteriaFor, parseExaminer, writingMessages } from "./examiner.ts";

const answer = (bands: Record<string, number>) => JSON.stringify({
  criteria: Object.fromEntries(Object.entries(bands).map(([k, b]) => [k, { band: b, notes: ["note"] }])),
  summary: "Хорошо, но мало примеров.",
  mistakes: [{ wrong: "peoples", right: "people", why: "уже мн. число" }, { wrong: "same", right: "same", why: "" }],
  rewrite: { original: "It is good.", improved: "It is undeniably beneficial." },
  next: ["Добавь пример в каждый абзац"],
});

test("overall band is the mean of the criteria, rounded the IELTS way", () => {
  const w = criteriaFor.writing("task2");
  assert.equal(parseExaminer(answer({ tr: 6, cc: 6.5, lr: 6, gr: 6.5 }), w)?.band, 6.5); // 6.25 -> 6.5
  assert.equal(parseExaminer(answer({ tr: 6.5, cc: 7, lr: 7, gr: 7 }), w)?.band, 7); // 6.875 -> 7.0
  assert.equal(parseExaminer(answer({ tr: 6, cc: 6, lr: 6, gr: 6.5 }), w)?.band, 6); // 6.125 -> 6.0
});

test("a missing criterion makes the whole answer unusable; no-op corrections are dropped", () => {
  const w = criteriaFor.writing("task2");
  assert.equal(parseExaminer(answer({ tr: 6, cc: 6, lr: 6 }), w), null);
  const ok = parseExaminer(answer({ tr: 6, cc: 6, lr: 6, gr: 6 }), w)!;
  assert.deepEqual(ok.mistakes.map((m) => m.wrong), ["peoples"]);
  assert.equal(ok.rewrite?.improved, "It is undeniably beneficial.");
  assert.equal(parseExaminer("not json", w), null);
});

test("task 1 shows the examiner the chart's data", () => {
  const m = writingMessages({ task: "task1", kind: "report", prompt: "Describe the chart.", chart: { type: "bar", values: [1, 2] }, text: "x", words: 1, flagged: [] });
  assert.match(m[1].content, /THE CHART'S DATA/);
  assert.match(m[0].content, /Task Achievement/);
});
