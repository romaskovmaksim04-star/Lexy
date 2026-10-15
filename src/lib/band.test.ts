import { test } from "node:test";
import assert from "node:assert/strict";
import { bandFromPractice, bandFromRaw, correctNeeded, overallBand, roundBand } from "./band.ts";

test("listening raw score converts to a band", () => {
  assert.equal(bandFromRaw("listening", 40), 9);
  assert.equal(bandFromRaw("listening", 30), 7);
  assert.equal(bandFromRaw("listening", 29), 6.5);
  assert.equal(bandFromRaw("listening", 0), 0);
});

test("general training reading is stricter than academic", () => {
  assert.equal(bandFromRaw("reading", 30, "academic"), 7);
  assert.equal(bandFromRaw("reading", 30, "general"), 6);
});

test("practice sets are scaled to 40 questions", () => {
  assert.equal(bandFromPractice("reading", 13, 13), 9);
  assert.equal(bandFromPractice("listening", 5, 10), 5.5);
  assert.equal(bandFromPractice("reading", 0, 0), 0);
});

test("overall band rounds quarters up", () => {
  assert.equal(roundBand(6.25), 6.5);
  assert.equal(roundBand(6.75), 7);
  assert.equal(roundBand(6.125), 6);
  assert.equal(overallBand([6.5, 6.5, 5, 7]), 6.5);
  assert.equal(overallBand([4, 3.5, 4, 4]), 4);
});

test("correct answers needed for a band", () => {
  assert.equal(correctNeeded("listening", 7), 30);
  assert.equal(correctNeeded("reading", 6.5, "general"), 32);
});
