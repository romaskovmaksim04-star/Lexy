import { test } from "node:test";
import assert from "node:assert/strict";
import { READING } from "./reading.ts";
import { LISTENING } from "./listening.ts";
import { SPEAKING, WRITING } from "./prompts.ts";
import { WORDS } from "./words.ts";
import { allQuestions, type QuestionGroup } from "./types.ts";

function checkGroups(testId: string, groups: QuestionGroup[]) {
  const ids = new Set<string>();
  for (const q of allQuestions(groups)) {
    assert.ok(!ids.has(q.id), `${testId}: duplicate question id ${q.id}`);
    ids.add(q.id);
    assert.ok(q.answer.length > 0 && q.answer.every((a) => a.trim()), `${testId}/${q.id}: empty answer`);
    assert.ok(q.why.trim(), `${testId}/${q.id}: no explanation`);
    if (q.kind === "tfng") assert.ok(q.answer.every((a) => ["TRUE", "FALSE", "NOT GIVEN"].includes(a)), `${testId}/${q.id}: bad TFNG answer`);
    if (q.kind === "ynng") assert.ok(q.answer.every((a) => ["YES", "NO", "NOT GIVEN"].includes(a)), `${testId}/${q.id}: bad YNNG answer`);
    if (q.kind === "mcq") {
      const codes = (q.options ?? []).map((o) => o.trim().split(/\s+/)[0]);
      assert.ok(codes.length >= 2, `${testId}/${q.id}: mcq without options`);
      assert.ok(q.answer.every((a) => codes.includes(a)), `${testId}/${q.id}: answer ${q.answer} not among ${codes}`);
    }
  }
}

test("reading tests are complete", () => {
  const ids = new Set<string>();
  for (const r of READING) {
    assert.ok(!ids.has(r.id), `duplicate reading id ${r.id}`);
    ids.add(r.id);
    assert.ok(r.passage.paragraphs.length >= 3, `${r.id}: passage too short`);
    checkGroups(r.id, r.groups);
  }
  assert.ok(READING.some((r) => r.format === "academic") && READING.some((r) => r.format === "general"));
});

test("listening tests are complete and cover all four parts", () => {
  for (const l of LISTENING) {
    assert.ok(l.script.length >= 5, `${l.id}: script too short`);
    for (const line of l.script) assert.ok(l.speakers[line.speaker], `${l.id}: unknown speaker`);
    checkGroups(l.id, l.groups);
  }
  assert.deepEqual([...new Set(LISTENING.map((l) => l.part))].sort(), [1, 2, 3, 4]);
});

test("writing and speaking prompts are well formed", () => {
  const ids = new Set<string>();
  for (const w of WRITING) {
    assert.ok(!ids.has(w.id)); ids.add(w.id);
    assert.ok(w.minWords === (w.task === "task1" ? 150 : 250), `${w.id}: wrong minimum`);
    if (w.chart?.kind === "line" || w.chart?.kind === "bar") {
      for (const s of w.chart.series) assert.equal(s.values.length, w.chart.x.length, `${w.id}: series length`);
    }
  }
  for (const s of SPEAKING) {
    assert.ok(!ids.has(s.id)); ids.add(s.id);
    assert.ok(s.questions.length >= 1);
    if (s.part === 2) assert.equal(s.prepSeconds, 60);
  }
});

test("vocabulary has unique ids and translations", () => {
  const ids = new Set<string>();
  for (const w of WORDS) {
    assert.ok(!ids.has(w.id), `duplicate word ${w.id}`);
    ids.add(w.id);
    assert.ok(w.ru && w.example && w.ipa, `${w.id}: incomplete`);
  }
});
