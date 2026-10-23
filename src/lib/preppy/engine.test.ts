import { test } from "node:test";
import assert from "node:assert/strict";
import { hookQuestion, respond, review, start, type Turn } from "./engine.ts";
import { topic } from "./topics.ts";

test("starts with the first question of the topic", () => {
  const { state, reply } = start("classic", "music", 42);
  assert.equal(state.q, 0);
  assert.ok(reply.endsWith(topic("music").questions[0]));
});

test("asks to expand a short answer and recasts a mistake", () => {
  const { state } = start("strict", "music", 1);
  const r = respond(state, "strict", "I am agree.");
  assert.equal(r.done, false);
  assert.equal(r.state.followed, true);
  assert.equal(r.state.q, 0);
  assert.equal(r.fix?.right, "I agree");
});

test("follows up on something the user mentioned", () => {
  assert.match(hookQuestion("I usually listen to music with my older sister on Sundays.", 3)!, /older sister/);
  assert.match(hookQuestion("Last summer we went to Kazan and it was great.", 3)!, /Kazan/);
  assert.equal(hookQuestion("It was fine and I liked it a lot.", 3), null);
});

test("moves through the questions and ends the conversation", () => {
  let { state } = start("kind", "food", 7);
  let done = false;
  let n = 0;
  while (!done && n < 20) {
    const r = respond(state, "kind", "I really enjoy cooking pasta because it is quick, and for example my friends love it when I cook for them.");
    state = r.state;
    done = r.done;
    n++;
  }
  assert.equal(done, true);
  assert.ok(n <= 10);
});

test("review counts words, fixes and simple-word repeats", () => {
  const turns: Turn[] = [
    { role: "preppy", text: "What do you like?" },
    { role: "user", text: "I am agree that music is very good and very important. It is good for people.", seconds: 8 },
    { role: "user", text: "My sister is very good at singing, it is a very good hobby.", seconds: 6 },
  ];
  const r = review(turns, "music");
  assert.equal(r.turns, 2);
  assert.ok(r.words > 20);
  assert.ok(r.fixes.some((f) => f.right === "I agree"));
  assert.ok(r.upgrades.some((u) => u.word === "very"));
});
