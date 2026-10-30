import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { isPremium } from "@/lib/access";

const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export async function GET(req: Request) {
  const me = await currentUser();
  if (!me || !isAdmin(me.email)) return new Response("not found", { status: 404 });
  const f = new URL(req.url).searchParams.get("f");
  const users = await db.user.findMany({ orderBy: { createdAt: "desc" } });
  const rows = users
    .filter((u) => (f === "premium" ? isPremium(u) : f === "free" ? !isPremium(u) : true))
    .map((u) => [u.email, u.name, u.goal, isPremium(u) ? u.plan : "free", u.premiumUntil?.toISOString().slice(0, 10), u.createdAt.toISOString().slice(0, 10), u.lastActive, u.emailOptIn ? "да" : "нет"].map(cell).join(","));
  const csv = "﻿" + ["email,имя,цель,тариф,premium до,регистрация,активность,рассылка", ...rows].join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="LexiUp-users.csv"' } });
}
