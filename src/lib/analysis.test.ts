import { test } from "node:test";
import assert from "node:assert/strict";
import { analyseEssay, analyseSpeech } from "./analysis.ts";
import { review } from "./srs.ts";

const GOOD = `Some people believe that university education should be free for everyone, while others argue that students should pay for their studies. In my view, the government should cover most of the cost, although students can contribute a small part.

On the one hand, free higher education gives talented young people from poor families a fair chance. For instance, a gifted student from a small village may never apply to a university if the fees are too high. As a result, the country loses specialists who could contribute to its economy.

On the other hand, universities need substantial funding to maintain modern laboratories and pay qualified teachers. If tuition is completely free, this burden falls on taxpayers, which may be unfair to people who never studied at university. Moreover, students who pay something are often more motivated.

In conclusion, I believe that the state should pay for the majority of university costs, because education benefits the whole society. However, a small fee or a loan system would ensure that students value their places and that universities remain well funded.`;

test("a structured essay scores higher than a short one", () => {
  const good = analyseEssay(GOOD);
  const bad = analyseEssay("Education is good. I think it should be free. Kids need it a lot of.");
  assert.ok(good.band >= 6, `good essay band ${good.band}`);
  assert.ok(bad.band < good.band);
  assert.equal(good.paragraphs, 4);
  assert.ok(good.linkers.includes("however"));
});

test("speech report counts pace and fillers", () => {
  const r = analyseSpeech("um I like um reading books because they um help me relax and you know learn new things", 10);
  assert.equal(r.words, 18);
  assert.equal(r.wpm, 108);
  assert.ok(r.fillers.find((f) => f.word === "um")?.count === 3);
});

test("spaced repetition grows the interval and resets on a miss", () => {
  const now = new Date("2026-10-16T10:00:00Z");
  const a = review({ ease: 2.5, interval: 0, reps: 0 }, 2, now);
  assert.equal(a.interval, 1);
  const b = review(a, 2, now);
  assert.equal(b.interval, 6);
  const c = review(b, 2, now);
  assert.equal(c.interval, 15);
  const miss = review(c, 0, now);
  assert.equal(miss.reps, 0);
  assert.ok(miss.ease < c.ease);
});
