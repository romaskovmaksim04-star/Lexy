import { test } from "node:test";
import assert from "node:assert/strict";
import { checkText, stillHas } from "./grammar.ts";

const flagged: [string, string, string][] = [
  ["I am agree with this statement.", "am-agree", "I agree"],
  ["My brother don't like it.", "dont-3rd", "My brother doesn't"],
  ["She have a car.", "have-3rd", "She has"],
  ["He work in a bank.", "3rd-s", "He works"],
  ["People is worried.", "people-is", "People are"],
  ["Students can to choose.", "can-to", "can choose"],
  ["I have lived here since five years.", "since-years", "for five years"],
  ["Trains are more better than cars.", "more-er", "better"],
  ["I didn't went home.", "did-past", "didn't go"],
  ["There is many reasons.", "there-is-many", "There are many"],
  ["If it will rain, we stay.", "if-will", "If it rain"],
  ["I enjoy to read.", "enjoy-to", "reading"],
  ["I will can to study abroad.", "will-can", "will be able to"],
  ["Please explain me the rule.", "explain-me", "explain to me"],
  ["We discussed about it.", "discuss-about", "discussed"],
  ["It depends of the weather.", "depend-of", "depends on"],
  ["She gave me an advice.", "a-advice", "a piece of advice"],
  ["I need more informations.", "plural-uncount", "information"],
  ["It is a important problem.", "a-vowel", "an important"],
  ["There are much cars.", "much-count", "many cars"],
  ["We made a lot of photos.", "make-photo", "took a lot of photos"],
  ["On my opinion, it is bad.", "on-my-opinion", "In my opinion"],
  ["It is one of the main reason.", "one-of-sing", "one of the main reasons"],
  ["I look forward to hear from you.", "look-forward", "look forward to hearing"],
  ["The goverment must act.", "sp-goverment", "government"],
];

for (const [text, rule, fix] of flagged) {
  test(`flags ${rule}`, () => {
    const issues = checkText(text);
    const hit = issues.find((i) => i.rule === rule);
    assert.ok(hit, `${rule} not found in "${text}": ${JSON.stringify(issues.map((i) => i.rule))}`);
    assert.equal(hit.fix, fix);
  });
}

const clean = [
  "Does he like music? I think she wants to study abroad, and it seems fine.",
  "Can she live alone? Why does he have to go? Let it go.",
  "You can bring something nice. They should sing more often.",
  "I agree that people are busy. There are many reasons, and it depends on money.",
  "I have lived here for five years and since 2019 I have worked in a hospital.",
  "This is a university, an hour later, an honest answer, a useful tool.",
  "In my opinion, the government should protect nature and the nature of work is changing.",
  "One of the main reasons is cost. I look forward to hearing from you.",
];

test("no false positives on correct text", () => {
  for (const text of clean) {
    const issues = checkText(text).filter((i) => i.kind !== "style");
    assert.deepEqual(issues.map((i) => `${i.rule}: ${i.original}`), [], text);
  }
});

test("speaking mode skips writing-only rules", () => {
  const issues = checkText("I don't think kids need a lot of homework.", "speaking");
  assert.equal(issues.filter((i) => i.kind === "style").length, 0);
});

test("stillHas detects whether a rewrite fixed the mistake", () => {
  assert.equal(stillHas("am-agree", "I am agree with you."), true);
  assert.equal(stillHas("am-agree", "I agree with you."), false);
});

test("landing demo samples are fully corrected", () => {
  const samples: [string, string[]][] = [
    ["I am agree that people is more happy in small towns.", ["am-agree", "people-is", "more-short"]],
    ["My brother don't like to make photos, but he enjoy to travel.", ["dont-3rd", "make-photo", "3rd-s", "enjoy-to"]],
    ["I have lived in Moscow since five years and I didn't went abroad.", ["since-years", "did-past"]],
    ["If I will pass IELTS, I will can to study in London.", ["if-will", "will-can"]],
  ];
  for (const [text, rules] of samples) {
    const got = checkText(text, "speaking").map((i) => i.rule);
    for (const r of rules) assert.ok(got.includes(r), `${r} missing in "${text}": ${got.join(", ")}`);
    let fixed = text;
    for (const i of checkText(text, "speaking").sort((a, b) => b.index - a.index)) fixed = fixed.slice(0, i.index) + i.fix + fixed.slice(i.index + i.original.length);
    assert.deepEqual(checkText(fixed, "speaking").filter((i) => i.kind !== "style").map((i) => i.rule), [], `still wrong after fixing: ${fixed}`);
  }
});
