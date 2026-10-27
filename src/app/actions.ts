"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser, endSession, startSession } from "@/lib/auth";
import { bandFromPractice } from "@/lib/band";
import { analyseEssay, analyseSpeech } from "@/lib/analysis";
import { getReading } from "@/lib/content/reading";
import { getListening } from "@/lib/content/listening";
import { getSpeaking, getWriting } from "@/lib/content/prompts";
import { allQuestions, isCorrect } from "@/lib/content/types";
import { WORDS } from "@/lib/content/words";
import { review, type Grade } from "@/lib/srs";
import { nextStreak, todayKey } from "@/lib/profile";
import { stillHas } from "@/lib/grammar";
import { timing, type TimedWord } from "@/lib/speech";
import { spend } from "@/lib/access";
import { signTts } from "@/lib/voice";
import { safeNext } from "@/lib/safe-next";
import { esc, notifyOwners } from "@/lib/notify";
import { drawWheel, SEGMENTS, wheelDiscount } from "@/lib/wheel";
import { cookies } from "next/headers";
import { persona as personaById } from "@/lib/preppy/personas";
import { LEXI_VOICE } from "@/lib/voices";
import { finishConversation, writeReview, type StoredReview } from "@/lib/lexi-server";
import { examineAttempt } from "@/lib/examiner-server";
import { llmEnabled } from "@/lib/llm";
import { after } from "next/server";

export type FormState = { error?: string; field?: string; ok?: boolean } | undefined;

const profileSchema = z.object({
  goal: z.enum(["ielts", "english"]).default("ielts"),
  format: z.enum(["academic", "general"]).default("academic"),
  targetBand: z.coerce.number().min(4).max(9).default(6.5),
  focusSkill: z.enum(["listening", "reading", "writing", "speaking"]).default("speaking"),
  examWindow: z.enum(["1m", "1-3m", "3-6m", "no-date"]).default("1-3m"),
  experience: z.enum(["yes", "mock", "real"]).default("yes"),
  dailyMinutes: z.coerce.number().int().min(10).max(240).default(30),
  worry: z.enum(["fail", "money", "time", "confidence"]).default("confidence"),
});

const signupSchema = profileSchema.extend({
  name: z.string().trim().min(1, "Как тебя зовут?").max(40),
  email: z.string().trim().toLowerCase().email("Проверь email"),
  password: z.string().min(8, "Пароль: минимум 8 символов").max(100),
  wheel: z.string().max(120).optional(),
  ref: z.string().max(40).optional(),
  plan: z.enum(["pro", "proplus"]).optional(),
});

function examDateFrom(window: string): Date | null {
  const days = { "1m": 30, "1-3m": 60, "3-6m": 120 }[window];
  return days ? new Date(Date.now() + days * 86_400_000) : null;
}

export async function signup(input: Record<string, unknown>): Promise<FormState> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue.message, field: String(issue.path[0] ?? "") };
  }
  const { password, ref, plan, wheel, ...data } = parsed.data;
  const exists = await db.user.findUnique({ where: { email: data.email } });
  if (exists) return { error: "Этот email уже зарегистрирован. Войди в аккаунт.", field: "email" };
  const referrer = ref ? await db.user.findUnique({ where: { referralCode: ref } }) : null;
  const user = await db.user.create({
    data: {
      ...data,
      examDate: examDateFrom(data.examWindow),
      discount: wheelDiscount(wheel),
      passwordHash: await bcrypt.hash(password, 10),
      referredBy: referrer?.id,
    },
  });
  await startSession(user.id);
  notifyOwners(`новая регистрация: <b>${esc(user.name)}</b>, цель ${user.targetBand.toFixed(1)}, фокус ${user.focusSkill}${referrer ? ", по приглашению" : ""}`);
  redirect(plan ? `/pricing/checkout?plan=${plan}` : "/app?welcome=1");
}

/** Spins the quiz wheel on the server; the browser only animates the result. */
export async function spinWheel(): Promise<{ index: number; percent: number; token: string }> {
  // One spin per visitor: a repeat spin returns the same prize
  const jar = await cookies();
  const saved = jar.get("lexy_wheel")?.value;
  const percent = wheelDiscount(saved);
  if (saved && percent) return { index: SEGMENTS.indexOf(percent), percent, token: saved };
  const r = drawWheel();
  jar.set("lexy_wheel", r.token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7200 });
  return r;
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Введи email и пароль" };
  const user = await db.user.findUnique({ where: { email } });
  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Неверный email или пароль" };
  }
  await startSession(user.id);
  redirect(safeNext(String(form.get("next") ?? "")));
}

export async function logout() {
  await endSession();
  redirect("/");
}

async function me() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

const settingsSchema = z.object({
  name: z.string().trim().min(1, "Имя не может быть пустым").max(40),
  format: z.enum(["academic", "general"]),
  targetBand: z.coerce.number().min(4).max(9),
  focusSkill: z.enum(["listening", "reading", "writing", "speaking"]),
  dailyMinutes: z.coerce.number().int().min(10).max(240),
  examDate: z.string().optional(),
  emailOptIn: z.string().optional(),
});

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await me();
  const parsed = settingsSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { examDate, emailOptIn, ...rest } = parsed.data;
  let date: Date | null = null;
  if (examDate) {
    date = new Date(`${examDate}T09:00:00`);
    const max = Date.now() + 3 * 365 * 86_400_000;
    if (Number.isNaN(date.getTime()) || date.getTime() < Date.now() - 86_400_000 || date.getTime() > max) {
      return { error: "Выбери дату в пределах ближайших 3 лет" };
    }
  }
  await db.user.update({ where: { id: user.id }, data: { ...rest, examDate: date, emailOptIn: emailOptIn === "on" } });
  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function deleteAccount(_: FormState, form: FormData): Promise<FormState> {
  const user = await me();
  if (String(form.get("email") ?? "").trim().toLowerCase() !== user.email) return { error: "Email не совпадает с адресом аккаунта" };
  await db.user.delete({ where: { id: user.id } });
  await endSession();
  redirect("/");
}

async function record(section: string, taskId: string, band: number, details: unknown, extra: { raw?: number; total?: number; minutes?: number } = {}) {
  const user = await me();
  const attempt = await db.attempt.create({
    data: {
      userId: user.id, section, taskId, band,
      raw: extra.raw, total: extra.total, minutes: extra.minutes ?? 0,
      details: JSON.stringify(details),
    },
  });
  await db.user.update({
    where: { id: user.id },
    data: {
      xp: { increment: 10 + Math.round(band * 5) },
      streak: nextStreak(user.streak, user.lastActive),
      lastActive: todayKey(),
    },
  });
  revalidatePath("/app", "layout");
  return attempt.id;
}

/** Reading and listening are scored on the server from the raw answers. */
export async function submitTest(kind: "reading" | "listening", testId: string, answers: Record<string, string>, minutes: number) {
  const test = kind === "reading" ? getReading(testId) : getListening(testId);
  if (!test) throw new Error("Unknown test");
  const questions = allQuestions(test.groups);
  const clean = Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, String(v).slice(0, 200)]));
  const correct = questions.filter((q) => isCorrect(q, clean[q.id])).length;
  const format = kind === "reading" ? (test as { format: "academic" | "general" }).format : "academic";
  const band = bandFromPractice(kind, correct, questions.length, format);
  const id = await record(kind, testId, band, { answers: clean }, { raw: correct, total: questions.length, minutes: Math.min(240, Math.max(0, Math.round(minutes))) });
  return { id, correct, total: questions.length, band };
}

export async function submitEssay(promptId: string, text: string, minutes: number): Promise<{ id?: string; error?: string }> {
  const user = await me();
  const prompt = getWriting(promptId);
  if (!prompt) throw new Error("Unknown prompt");
  const essay = text.slice(0, 20_000);
  const kind = prompt.task === "task2" ? "essay" : prompt.format === "general" ? "letter" : "report";
  const report = analyseEssay(essay, prompt.task, { kind, prompt: prompt.text });
  if (report.words < 20) return { error: "Слишком коротко для оценки: нужно хотя бы 20 слов." };
  const quota = await spend(user, "essay_checks");
  if (!quota.ok) return { error: "limit" };
  const examine = llmEnabled();
  const id = await record("writing", promptId, report.band, { text: essay, report, examinerState: examine ? "pending" : undefined }, { minutes: Math.round(minutes) });
  if (examine) after(() => examineAttempt(id));
  return { id };
}

const partSchema = z.object({
  question: z.string().max(1000),
  text: z.string().max(10_000),
  duration: z.number().min(0).max(600),
  words: z.array(z.object({ w: z.string().max(60), s: z.number(), e: z.number(), p: z.number() })).max(3000).optional(),
});

/** A speaking task answered question by question; each part comes with its own timing. */
export async function submitSpeaking(taskId: string, input: unknown): Promise<{ id?: string; error?: string }> {
  const user = await me();
  const task = getSpeaking(taskId);
  if (!task) throw new Error("Unknown task");
  const parts = z.array(partSchema).min(1).max(12).parse(input);
  const answered = parts.filter((p) => p.text.trim().split(/\s+/).length >= 3);
  if (!answered.length) return { error: "Мы тебя не услышали. Проверь микрофон и попробуй снова." };
  const quota = await spend(user, "speech_checks");
  if (!quota.ok) return { error: "limit" };

  // Join the parts into one timeline so pauses between questions are not counted
  const words: TimedWord[] = [];
  let offset = 0;
  for (const p of parts) {
    for (const w of p.words ?? []) words.push({ ...w, s: w.s + offset, e: w.e + offset });
    offset += (p.words?.length ? p.words[p.words.length - 1].e : p.duration) + 0.4;
  }
  const text = answered.map((p) => p.text.trim()).join(" ");
  const seconds = parts.reduce((a, p) => a + p.duration, 0);
  const t = words.length ? timing(words, offset) : undefined;
  const report = analyseSpeech(text, seconds, t);
  const perPart = parts.map((p) => ({
    question: p.question,
    text: p.text,
    duration: p.duration,
    words: p.words ?? [],
    timing: p.words?.length ? timing(p.words, p.duration) : null,
  }));
  const examine = llmEnabled();
  const id = await record("speaking", taskId, report.band, { parts: perPart, report, examinerState: examine ? "pending" : undefined }, { minutes: Math.ceil(seconds / 60) });
  if (examine) after(() => examineAttempt(id));
  return { id };
}

/** "Contract" drill: did the rewrite remove the mistake while keeping the sentence? */
export async function checkRewrite(rule: string, original: string, rewrite: string): Promise<{ fixed: boolean; close: boolean }> {
  const r = rewrite.trim().slice(0, 600);
  const words = (s: string) => new Set(s.toLowerCase().match(/[a-z']+/g) ?? []);
  const a = words(original);
  const b = words(r);
  const shared = [...a].filter((w) => b.has(w)).length;
  const kept = a.size ? shared / a.size : 0;
  const fixed = r.length > 3 && !stillHas(rule, r) && kept >= 0.4;
  return { fixed, close: !fixed && kept >= 0.4 };
}

export async function reviewWord(wordId: string, grade: Grade) {
  const user = await me();
  if (!wordId.startsWith("u:") && !WORDS.some((w) => w.id === wordId)) throw new Error("Unknown word");
  if (wordId.startsWith("u:")) {
    const own = await db.userWord.findFirst({ where: { id: wordId.slice(2), userId: user.id } });
    if (!own) throw new Error("Unknown word");
  }
  const card = await db.card.findUnique({ where: { userId_wordId: { userId: user.id, wordId } } });
  const next = review(card ?? { ease: 2.5, interval: 0, reps: 0 }, grade);
  await db.card.upsert({
    where: { userId_wordId: { userId: user.id, wordId } },
    create: { userId: user.id, wordId, ...next, lapses: grade === 0 ? 1 : 0 },
    update: { ...next, lapses: grade === 0 ? { increment: 1 } : undefined },
  });
  if (grade > 0) {
    await db.user.update({
      where: { id: user.id },
      data: { xp: { increment: 1 }, streak: nextStreak(user.streak, user.lastActive), lastActive: todayKey() },
    });
  }
}

export async function addWord(term: string, meaning = "", example = "", source = "manual"): Promise<{ ok: boolean; error?: string }> {
  const user = await me();
  const t = term.trim().replace(/\s+/g, " ").slice(0, 60);
  if (!t || !/[a-z]/i.test(t)) return { ok: false, error: "Введи слово по-английски" };
  const word = await db.userWord.upsert({
    where: { userId_term: { userId: user.id, term: t.toLowerCase() } },
    create: { userId: user.id, term: t.toLowerCase(), meaning: meaning.slice(0, 200), example: example.slice(0, 300), source },
    update: meaning ? { meaning: meaning.slice(0, 200) } : {},
  });
  await db.card.upsert({
    where: { userId_wordId: { userId: user.id, wordId: `u:${word.id}` } },
    create: { userId: user.id, wordId: `u:${word.id}` },
    update: {},
  });
  revalidatePath("/app/words");
  return { ok: true };
}

export async function removeWord(id: string) {
  const user = await me();
  await db.userWord.deleteMany({ where: { id, userId: user.id } });
  await db.card.deleteMany({ where: { userId: user.id, wordId: `u:${id}` } });
  revalidatePath("/app/words");
}

/** Starts learning built-in words: puts them into the review queue. */
export async function learnWords(ids: string[]) {
  const user = await me();
  const valid = ids.filter((id) => WORDS.some((w) => w.id === id)).slice(0, 50);
  for (const wordId of valid) {
    await db.card.upsert({
      where: { userId_wordId: { userId: user.id, wordId } },
      create: { userId: user.id, wordId },
      update: {},
    });
  }
  revalidatePath("/app/words");
}

// ---------- Lexi (voice conversation) ----------
// The call itself streams through /api/lexi; these are the pieces around it.

/** A signed sample of a character in a voice, for the picker (voiced once, then cached). */
export async function lexiSample(personaId: string): Promise<string> {
  await me();
  const p = personaById(personaId);
  return signTts(p.sample, `g:${LEXI_VOICE}`, { style: p.id, mood: p.id === "roast" ? "dramatic" : "warm" });
}

/** Ends a call: the review page opens at once, Lexi's written review follows in seconds. */
export async function preppyEnd(id: string): Promise<{ ok: boolean }> {
  const user = await me();
  const conv = await db.conversation.findFirst({ where: { id, userId: user.id } });
  if (!conv) return { ok: false };
  if (await finishConversation(id)) after(() => writeReview(id));
  revalidatePath("/app/lexi");
  return { ok: true };
}

/** The examiner is still marking this Writing or Speaking answer (the results page polls this). */
export async function examinerPending(id: string): Promise<boolean> {
  const user = await me();
  const a = await db.attempt.findFirst({ where: { id, userId: user.id }, select: { details: true } });
  return !!a && (JSON.parse(a.details) as { examinerState?: string }).examinerState === "pending";
}

/** Lexi's review is still being written (the review page polls this). */
export async function reviewPending(id: string): Promise<boolean> {
  const user = await me();
  const conv = await db.conversation.findFirst({ where: { id, userId: user.id }, select: { review: true } });
  return !!conv?.review && (JSON.parse(conv.review) as StoredReview).llmState === "pending";
}
