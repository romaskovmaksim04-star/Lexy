import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPlan, type PlanInput } from "./plan.ts";

const base: PlanInput = {
  focus: "speaking",
  minutes: 30,
  format: "academic",
  measured: new Set(),
  tried: new Set(),
  doneToday: new Set(),
  dueWords: 0,
  talkedToday: false,
  date: new Date("2026-10-21T09:00:00Z"),
};

test("a new student starts with the level check, focus section first", () => {
  const plan = buildPlan(base);
  assert.ok(plan.length >= 1);
  assert.equal(plan[0].kind, "speaking");
  assert.ok(plan.every((t) => t.diagnostic));
});

test("after the check the plan mixes the focus with other sections and Lexi", () => {
  const plan = buildPlan({ ...base, measured: new Set(["reading", "listening", "writing", "speaking"]) });
  assert.equal(plan[0].kind, "speaking");
  assert.ok(plan.some((t) => t.kind === "preppy"));
  assert.ok(plan.every((t) => !t.diagnostic));
});

test("due words come first and tasks done today are ticked", () => {
  const first = buildPlan({ ...base, measured: new Set(["reading", "listening", "writing", "speaking"]), dueWords: 7 });
  assert.equal(first[0].kind, "words");
  const id = first[1].id;
  const again = buildPlan({ ...base, measured: new Set(["reading", "listening", "writing", "speaking"]), dueWords: 7, doneToday: new Set([id]), tried: new Set([id]) });
  assert.equal(again.find((t) => t.id === id)?.done, true);
});

test("more time gives more tasks", () => {
  const all = new Set(["reading", "listening", "writing", "speaking"] as const);
  const short = buildPlan({ ...base, minutes: 15, measured: all });
  const long = buildPlan({ ...base, minutes: 120, measured: all });
  assert.ok(long.length > short.length);
});
