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

export type FormState = { error?: string; field?: string } | undefined;

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
});

export async function signup(input: Record<string, unknown>): Promise<FormState> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue.message, field: String(issue.path[0] ?? "") };
  }
  const { password, ...data } = parsed.data;
  const exists = await db.user.findUnique({ where: { email: data.email } });
  if (exists) return { error: "Этот email уже зарегистрирован. Войди в аккаунт.", field: "email" };
  const user = await db.user.create({
    data: { ...data, passwordHash: await bcrypt.hash(password, 10) },
  });
  await startSession(user.id);
  redirect("/app?welcome=1");
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Введи email и пароль" };
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Неверный email или пароль" };
  }
  await startSession(user.id);
  redirect("/app");
}

export async function logout() {
  await endSession();
  redirect("/");
}

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) redirect("/login");
  const parsed = profileSchema
    .extend({ name: z.string().trim().min(1, "Имя не может быть пустым").max(40) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.user.update({ where: { id: user.id }, data: parsed.data });
  revalidatePath("/app", "layout");
  return {};
}

async function record(section: string, taskId: string, band: number, details: unknown, extra: { raw?: number; total?: number; minutes?: number } = {}) {
  const user = await currentUser();
  if (!user) redirect("/login");
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
  const correct = questions.filter((q) => isCorrect(q, answers[q.id])).length;
  const format = kind === "reading" ? (test as { format: "academic" | "general" }).format : "academic";
  const band = bandFromPractice(kind, correct, questions.length, format);
  await record(kind, testId, band, { answers }, { raw: correct, total: questions.length, minutes });
  return { correct, total: questions.length, band };
}

export async function submitEssay(promptId: string, text: string, minutes: number) {
  const prompt = getWriting(promptId);
  if (!prompt) throw new Error("Unknown prompt");
  const report = analyseEssay(text.slice(0, 20_000), prompt.task);
  if (report.words >= 20) await record("writing", promptId, report.band, { text, report }, { minutes });
  return report;
}

export async function submitSpeech(taskId: string, transcript: string, seconds: number) {
  if (!getSpeaking(taskId)) throw new Error("Unknown task");
  const report = analyseSpeech(transcript.slice(0, 10_000), seconds);
  if (report.words >= 8) await record("speaking", taskId, report.band, { transcript, report }, { minutes: Math.ceil(seconds / 60) });
  return report;
}

export async function reviewWord(wordId: string, grade: Grade) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!WORDS.some((w) => w.id === wordId)) throw new Error("Unknown word");
  const card = await db.card.findUnique({ where: { userId_wordId: { userId: user.id, wordId } } });
  const next = review(card ?? { ease: 2.5, interval: 0, reps: 0 }, grade);
  await db.card.upsert({
    where: { userId_wordId: { userId: user.id, wordId } },
    create: { userId: user.id, wordId, ...next },
    update: next,
  });
  if (grade > 0) await db.user.update({ where: { id: user.id }, data: { xp: { increment: 1 } } });
}
