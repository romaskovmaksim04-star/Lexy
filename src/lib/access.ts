import "server-only";
import type { User } from "@prisma/client";
import { db } from "./db";
import { todayKey } from "./profile";

// Who may use what, and how much per day. LEXY_OPEN_BETA=1 opens everything for testers.

export type Quota = "preppy_seconds" | "speech_checks" | "essay_checks";

// Lexi is counted in seconds of the student's own speech. Each of those minutes is about six
// lines of Lexi, roughly 0.9 ₽ of voice and model (measured 2026-10-23), hence the limits.
const LIMITS: Record<Quota, { free: number; pro: number; proplus: number }> = {
  preppy_seconds: { free: 3 * 60, pro: 30 * 60, proplus: 60 * 60 },
  speech_checks: { free: 3, pro: 40, proplus: 80 },
  essay_checks: { free: 2, pro: 15, proplus: 30 },
};

export function openBeta(): boolean {
  return process.env.LEXY_OPEN_BETA === "1";
}

export function isPremium(user: Pick<User, "plan" | "premiumUntil">, now = new Date()): boolean {
  if (openBeta()) return true;
  return user.plan !== "free" && !!user.premiumUntil && user.premiumUntil > now;
}

export function limitFor(user: Pick<User, "plan" | "premiumUntil">, kind: Quota): number {
  if (!isPremium(user)) return LIMITS[kind].free;
  return user.plan === "proplus" || openBeta() ? LIMITS[kind].proplus : LIMITS[kind].pro;
}

export async function used(userId: string, kind: Quota): Promise<number> {
  const row = await db.usage.findUnique({ where: { userId_day_kind: { userId, day: todayKey(), kind } } });
  return row?.count ?? 0;
}

/** Takes `amount` from today's quota. Returns false (and takes nothing) when it would go over. */
export async function spend(user: Pick<User, "id" | "plan" | "premiumUntil">, kind: Quota, amount = 1): Promise<{ ok: boolean; left: number }> {
  const limit = limitFor(user, kind);
  const now = await used(user.id, kind);
  if (now + amount > limit) return { ok: false, left: Math.max(0, limit - now) };
  await db.usage.upsert({
    where: { userId_day_kind: { userId: user.id, day: todayKey(), kind } },
    create: { userId: user.id, day: todayKey(), kind, count: amount },
    update: { count: { increment: amount } },
  });
  return { ok: true, left: limit - now - amount };
}

export async function remaining(user: Pick<User, "id" | "plan" | "premiumUntil">, kind: Quota): Promise<number> {
  return Math.max(0, limitFor(user, kind) - (await used(user.id, kind)));
}
