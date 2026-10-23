import { test } from "node:test";
import assert from "node:assert/strict";
import { matchWords, phraseScore } from "./score.ts";

test("marks the words that were said, in order", () => {
  assert.deepEqual(matchWords("She decided to take a walk in the park.", "she decided to walk in park"), [true, true, true, false, false, true, true, false, true]);
});

test("perfect phrase doubles the points", () => {
  const hit = matchWords("He plays the guitar very well.", "He plays the guitar very well");
  assert.deepEqual(phraseScore(hit), { points: 120, accuracy: 1, perfect: true });
});

test("handles apostrophes and empty speech", () => {
  assert.deepEqual(matchWords("I'm fine", "Im fine"), [false, true]);
  assert.equal(phraseScore(matchWords("Hello there", "")).points, 0);
});
