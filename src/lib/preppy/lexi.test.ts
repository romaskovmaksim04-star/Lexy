import { test } from "node:test";
import assert from "node:assert/strict";
import { chatMessages, clean, openingMessages, isFinal, marksFor, parseTagged, parseTurn, readMood, SayStream, speechParts, studentLine, systemPrompt, type LexiSettings } from "./lexi.ts";
import { parseReview, speechStats } from "./lexi-review.ts";
import { customTopic, cleanTopicTitle } from "./topics.ts";

const base: LexiSettings = { persona: "roast", lang: "mix", swear: false, name: "Костя", band: 6.5, female: true };

test("reads a tagged answer with a fix that points at the student's words", () => {
  const p = parseTagged("<mood>angry</mood><say>Стоп. Мы говорим people. So, why the park?</say><fix><wrong>peoples</wrong><right>people</right><why>people уже мн. число</why></fix>", "Many peoples go to the park.");
  assert.equal(p.mood, "angry");
  assert.equal(p.say, "Стоп. Мы говорим people. So, why the park?");
  assert.equal(p.fix?.right, "people");
  assert.equal(p.end, false);
});

test("leaked thinking is never spoken", () => {
  const p = parseTagged("<|analysis|>The user made an error, I'll be helpful.<|analysis|><mood>teasing</mood><say>Goed? Серьёзно?</say>", "I goed home");
  assert.equal(p.say, "Goed? Серьёзно?");
  assert.equal(p.mood, "teasing");
});

test("invented moods map to known ones, unknown ones are dropped", () => {
  assert.equal(readMood("amused"), "laughing");
  assert.equal(readMood("Furious"), "angry");
  assert.equal(readMood("purple"), null);
});

test("drops a fix for words the student never said", () => {
  const p = parseTagged("<mood>warm</mood><say>Nice!</say><fix><wrong>goed</wrong><right>went</right><why></why></fix>", "I went home.");
  assert.equal(p.fix, undefined);
});

test("an answer without tags is spoken as is; old JSON answers still work", () => {
  assert.equal(parseTagged("Just text here.", "").say, "Just text here.");
  assert.equal(parseTurn('{"reply": "Hi!", "mood": "warm", "done": true}', "")?.done, true);
  assert.equal(parseTurn(null, ""), null);
});

test("the stream hands out the first sentence before the answer is complete", () => {
  const s = new SayStream("");
  const chunks = ["<mood>excited</mood><say>Ооо, вот это ", "ответ! Ты реально ", "постарался. So, why?</say>"];
  const got: string[] = [];
  let mood = null;
  for (const c of chunks) {
    const r = s.push(c);
    mood ??= r.mood;
    got.push(...r.parts);
  }
  const end = s.finish();
  got.push(...end.parts);
  assert.equal(mood, "excited");
  assert.deepEqual(got, ["Ооо, вот это ответ!", "Ты реально постарался. So, why?"]);
  assert.equal(end.parsed.say, "Ооо, вот это ответ! Ты реально постарался. So, why?");
});

test("a short opener is merged with the next sentence for intonation", () => {
  const s = new SayStream("");
  const got = [...s.push("<mood>shocked</mood><say>Стоп. Что? Ты серьёзно сказал goed? </say>").parts, ...s.finish().parts];
  assert.deepEqual(got, ["Стоп. Что?", "Ты серьёзно сказал goed?"]);
});

test("strips stage directions, markdown, emojis and stray tags before speech", () => {
  assert.equal(clean("*laughs* That's **great** 🔥 <b>!</b>"), "That's great !");
});

test("splits a reply so the first part is short", () => {
  assert.deepEqual(speechParts("Wait. What? You learn only pretty words? Is this a dating app?"), ["Wait. What?", "You learn only pretty words? Is this a dating app?"]);
  assert.deepEqual(speechParts("One sentence only"), ["One sentence only"]);
});

test("profanity, language and Lexi's gender follow the settings", () => {
  assert.match(systemPrompt(base, "music"), /Profanity is OFF/);
  assert.match(systemPrompt({ ...base, swear: true }, "music"), /SNAP/);
  assert.match(systemPrompt({ ...base, lang: "en" }, "music"), /Speak ONLY English/);
  assert.match(systemPrompt(base, "music"), /я сказала/);
  assert.match(systemPrompt({ ...base, female: false }, "music"), /я сказал,/);
});

test("a typed-in topic is used and cleaned", () => {
  assert.match(systemPrompt({ ...base, topicTitle: "Dota 2" }, "custom"), /chosen by the student: «Dota 2»/);
  assert.equal(cleanTopicTitle("  <b>Моя\n кошка</b> "), "b Моя кошка /b");
  assert.equal(customTopic("").title, "твоя тема");
});

test("student lines carry how they were said", () => {
  assert.equal(studentLine({ role: "user", text: "Я не знаю", seconds: 2 }), "[speech 2s, Russian] Я не знаю");
  assert.equal(studentLine({ role: "user", text: "hi", typed: true }), "[typed] hi");
  assert.equal(studentLine({ role: "user", text: "" }), "(silence)");
});

test("asks to wrap up after the last answer; two student lines in a row are joined", () => {
  const turns = Array.from({ length: 12 }, (_, i) => ({ role: "user" as const, text: `answer ${i}`, seconds: 3 }));
  const m = chatMessages(base, "music", turns);
  assert.match(m[m.length - 1].content, /last answer/);
  assert.equal(m.filter((x) => x.role === "user").length, 1);
});

test("with profanity on, a swear reminder comes right before the answer", () => {
  const turns = [{ role: "user" as const, text: "I am play Dota", seconds: 2 }];
  const on = chatMessages({ ...base, swear: true }, "music", turns);
  assert.match(on[on.length - 1].content, /Profanity is ON/);
  assert.match(openingMessages({ ...base, swear: true }, "music").at(-1)!.content, /Profanity is ON/);
  const off = chatMessages(base, "music", turns);
  assert.equal(off[off.length - 1].role, "user");
});

test("a goodbye closes the call even without the end tag", () => {
  assert.equal(isFinal({ say: "Ладно, на сегодня хватит, разбор уже на экране. Пока!", end: false }, 6), true);
  assert.equal(isFinal({ say: "Ладно, на сегодня хватит? Расскажи ещё?", end: false }, 6), false);
  assert.equal(isFinal({ say: "Пока!", end: false }, 1), false);
  assert.equal(isFinal({ say: "Anything", end: true }, 1), true);
});

test("review: parses, clamps bands, and refuses to grade too little English", () => {
  const raw = JSON.stringify({
    bands: { overall: 9, fluency: 5.5, lexical: 5, grammar: 5.5 }, summary: "Неплохо.",
    strengths: ["a"], work: ["b"], mistakes: [{ wrong: "I goed", right: "I went", why: "неправильный глагол" }],
    better: [{ original: "I like it", improved: "I'm really into it" }], vocab: [{ en: "unwind", ru: "расслабиться", example: "I unwind." }], next: ["c"],
  });
  const many = speechStats([{ role: "user", text: "word ".repeat(60), seconds: 30 }]);
  const r = parseReview(raw, many)!;
  assert.equal(r.bands.overall, 5.5); // 9 is far from the criteria: their mean wins
  assert.equal(r.mistakes[0].right, "I went");
  const few = speechStats([{ role: "user", text: "I don't know", seconds: 2 }]);
  assert.equal(parseReview(raw, few)!.bands.fluency, null);
  assert.equal(parseReview("nonsense", many), null);
});

test("a half-written tag at the start of the stream is never spoken", () => {
  const s = new SayStream("");
  assert.deepEqual(s.push("<m").parts, []);
  assert.equal(s.current(), "");
  const got = [...s.push("ood>warm</mood><say>My kids are lucky. ").parts, ...s.push("They have a big garden.</say>").parts, ...s.finish().parts];
  assert.deepEqual(got, ["My kids are lucky.", "They have a big garden."]);
});

test("a bug the student reports is read from its tag and never spoken", () => {
  const p = parseTagged("<mood>sympathetic</mood><say>Ой, передала команде. Давай дальше!</say><bug>Английская речь в транскрипции наполовину переведена на русский</bug>", "half of my words came out in Russian");
  assert.equal(p.say, "Ой, передала команде. Давай дальше!");
  assert.equal(p.bug, "Английская речь в транскрипции наполовину переведена на русский");
  assert.equal(parseTagged("<mood>warm</mood><say>Nice!</say>", "hi").bug, undefined);
});

test("mood tags inside the speech mark where the face changes, and are never spoken", () => {
  const raw = "<mood>laughing</mood><say>Ха, Dota? <shocked/>Целые выходные?! <teasing/>Ну ты даёшь.</say>";
  const p = parseTagged(raw, "I played Dota all weekend");
  assert.equal(p.say, "Ха, Dota? Целые выходные?! Ну ты даёшь.");
  assert.deepEqual(p.marks.map((m) => m.mood), ["shocked", "teasing"]);
  const s = new SayStream("I played Dota all weekend");
  const parts = [...s.push(raw).parts, ...s.finish().parts];
  const all = parts.flatMap((part) => marksFor(part, s.marks()).map(([i, m]) => `${m}@${part.slice(i, i + 5)}`));
  assert.deepEqual(all, ["shocked@Целые", "teasing@Ну ты"]);
});
