import { test } from "node:test";
import assert from "node:assert/strict";
import { liveStreak, nextStreak } from "./profile.ts";

test("streak continues from yesterday and resets after a gap", () => {
  const now = new Date("2026-10-16T09:00:00Z");
  assert.equal(nextStreak(4, "2026-10-15", now), 5);
  assert.equal(nextStreak(4, "2026-10-16", now), 4);
  assert.equal(nextStreak(4, "2026-10-12", now), 1);
  assert.equal(liveStreak(4, "2026-10-15", now), 4);
  assert.equal(liveStreak(4, "2026-10-13", now), 0);
});
