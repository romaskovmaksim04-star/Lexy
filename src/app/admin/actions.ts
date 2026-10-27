"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

/** Adds days of Premium (from today or from the current end, whichever is later); 0 days takes it away. */
export async function grantPremium(userId: string, days: number, plan: "pro" | "proplus" = "pro") {
  await requireAdmin();
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return;
  if (days <= 0) {
    await db.user.update({ where: { id: userId }, data: { plan: "free", premiumUntil: null } });
  } else {
    const from = user.premiumUntil && user.premiumUntil > new Date() ? user.premiumUntil : new Date();
    await db.user.update({ where: { id: userId }, data: { plan, premiumUntil: new Date(from.getTime() + Math.min(days, 3650) * 86_400_000) } });
  }
  revalidatePath("/admin");
}

const noticeSchema = z.object({
  text: z.string().trim().min(3).max(400),
  link: z.string().trim().max(200).refine((s) => !s || s.startsWith("/") || s.startsWith("https://"), "Ссылка: /путь или https://"),
  audience: z.enum(["all", "free", "premium"]),
});

export async function postNotice(_: unknown, form: FormData): Promise<{ error?: string; ok?: boolean }> {
  await requireAdmin();
  const p = noticeSchema.safeParse(Object.fromEntries(form));
  if (!p.success) return { error: p.error.issues[0].message };
  await db.notice.create({ data: p.data });
  revalidatePath("/admin");
  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function hideNotice(id: string) {
  await requireAdmin();
  await db.notice.update({ where: { id }, data: { active: false } });
  revalidatePath("/admin");
  revalidatePath("/app", "layout");
}
