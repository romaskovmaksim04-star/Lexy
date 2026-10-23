import { test } from "node:test";
import assert from "node:assert/strict";
import { activity, predicted, readiness, sectionBands, topMistakes, type AttemptRow } from "./insights.ts";

const day = (n: number) => new Date(Date.UTC(2026, 9, 1 + n, 10));

const rows: AttemptRow[] = [
  { section: "reading", band: 6, createdAt: day(1), details: "{}", taskId: "a" },
  { section: "reading", band: 7, createdAt: day(2), details: "{}", taskId: "b" },
  { section: "writing", band: 5.5, createdAt: day(3), taskId: "w", details: JSON.stringify({ report: { criteria: [], issues: [{ rule: "am-agree", original: "I am agree", fix: "I agree", why: "x", kind: "grammar" }] } }) },
  { section: "speaking", band: 6, createdAt: day(4), taskId: "s", details: JSON.stringify({ report: { issues: [{ rule: "am-agree", original: "am agree", fix: "agree", why: "x", kind: "grammar" }] } }) },
];

test("section bands average recent attempts", () => {
  const b = sectionBands(rows);
  assert.equal(b.reading.band, 6.5);
  assert.equal(b.reading.count, 2);
  assert.equal(b.listening.band, null);
});

test("prediction uses measured sections only", () => {
  const p = predicted(sectionBands(rows));
  assert.equal(p.measured, 3);
  assert.equal(p.band, 6);
});

test("readiness compares needed pace with a realistic one", () => {
  const now = new Date(Date.UTC(2026, 9, 21));
  assert.equal(readiness(7, 6.5, null, 30, now).kind, "done");
  assert.equal(readiness(6, 7, null, 30, now).kind, "no-date");
  assert.equal(readiness(6, 6.5, new Date(Date.UTC(2027, 0, 21)), 30, now).kind, "on-track");
  assert.equal(readiness(5, 7.5, new Date(Date.UTC(2026, 9, 28)), 30, now).kind, "behind");
});

test("mistakes are counted across writing and speaking", () => {
  const top = topMistakes(rows);
  assert.equal(top[0].rule, "am-agree");
  assert.equal(top[0].count, 2);
});

test("activity grid starts on a Monday and ends today", () => {
  const now = new Date(Date.UTC(2026, 9, 21, 12));
  const grid = activity([day(19), day(19), day(20)], 4, now);
  assert.equal(new Date(grid[0].day).getUTCDay(), 1);
  assert.equal(grid[grid.length - 1].day, "2026-10-21");
  assert.equal(grid.find((d) => d.day === "2026-10-20")?.count, 2);
});
