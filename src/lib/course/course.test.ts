import { test } from "node:test";
import assert from "node:assert/strict";
import { LESSONS, READINGS } from "./data.ts";
import { LEVELS } from "./types.ts";
import { LESSONS_PER_LEVEL, lessonSteps, levelTest, nextLevel, score } from "./course.ts";

test("every level has its lessons and reading texts, all questions answerable", () => {
  for (const lv of LEVELS) {
    assert.equal(LESSONS[lv].length, LESSONS_PER_LEVEL, lv);
    assert.ok(READINGS[lv].length >= 6, lv);
    for (const l of LESSONS[lv]) {
      for (const q of [...l.gr, ...l.ws, ...l.li.q]) assert.ok(q.a >= 0 && q.a < q.o.length && new Set(q.o).size === q.o.length, `${lv} ${l.t}`);
      assert.ok(l.th.ex.length && l.li.script.length > 20, `${lv} ${l.t}`);
    }
  }
});

test("right answers are not parked on one option", () => {
  const at = [0, 0, 0, 0];
  for (const lv of LEVELS) for (const l of LESSONS[lv]) for (const q of l.ws) at[q.a]++;
  assert.ok(Math.max(...at) < 0.4 * at.reduce((a, b) => a + b));
});

test("a lesson runs theory first, ends with a review, reading every fifth lesson", () => {
  const s = lessonSteps("A1", 1);
  assert.equal(s[0].kind, "theory");
  assert.equal(s.at(-1)!.kind, "quiz");
  assert.ok(!s.some((x) => x.kind === "reading"));
  assert.ok(lessonSteps("B1", 5).some((x) => x.kind === "reading"));
  assert.deepEqual(lessonSteps("A1", 31), []);
});

test("level test and scoring", () => {
  const t = levelTest("B2");
  assert.equal(t.questions.length, 12);
  assert.deepEqual(score(t.questions, t.questions.map((q) => q.a)), { right: 12, total: 12 });
  assert.equal(score(t.questions, []).right, 0);
  assert.equal(nextLevel("C1"), null);
  assert.equal(nextLevel("A1"), "A2");
});
