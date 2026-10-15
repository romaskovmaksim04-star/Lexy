import { test } from "node:test";
import assert from "node:assert/strict";
import { dailyPlan, liveStreak, nextStreak } from "./profile.ts";

test("plan grows with the time the student has", () => {
  const d = new Date("2026-10-16T09:00:00Z");
  assert.equal(dailyPlan("speaking", 15, d).length, 2);
  assert.equal(dailyPlan("speaking", 30, d).length, 3);
  assert.equal(dailyPlan("speaking", 120, d).length, 5);
  assert.equal(dailyPlan("writing", 15, d)[1].section, "writing");
});

test("streak continues from yesterday and resets after a gap", () => {
  const now = new Date("2026-10-16T09:00:00Z");
  assert.equal(nextStreak(4, "2026-10-15", now), 5);
  assert.equal(nextStreak(4, "2026-10-16", now), 4);
  assert.equal(nextStreak(4, "2026-10-12", now), 1);
  assert.equal(liveStreak(4, "2026-10-15", now), 4);
  assert.equal(liveStreak(4, "2026-10-13", now), 0);
});
