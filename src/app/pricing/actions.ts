"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { plan as planByKey } from "@/lib/pricing";
import { priceFor } from "@/lib/checkout";
import { createTransaction, paymentsEnabled } from "@/lib/platega";

export type CheckoutState = { error?: string } | undefined;

export async function startCheckout(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  const user = await currentUser();
  if (!user) redirect("/login?next=/pricing");
  const key = String(form.get("plan") ?? "");
  const p = planByKey(key);
  if (!p || !p.price) return { error: "Такого тарифа нет" };
  if (!paymentsEnabled()) return { error: "Оплата скоро откроется. Пока идёт открытое тестирование, всё доступно бесплатно." };
  const price = await priceFor(user.id, key);
  if (!price) return { error: "Не удалось посчитать цену" };
  // Reuse a fresh pending order for the same plan instead of piling up new ones
  const recent = await db.order.findFirst({ where: { userId: user.id, planKey: key, status: "pending", createdAt: { gt: new Date(Date.now() - 10 * 60_000) } } });
  const order = recent ?? (await db.order.create({ data: { userId: user.id, planKey: key, amount: price.amount } }));
  const h = await headers();
  const site = process.env.SITE_URL ?? `https://${h.get("host")}`;
  let url: string;
  try {
    const tx = await createTransaction({
      orderId: order.id,
      amount: order.amount,
      description: `LexiUp ${p.name}, 1 месяц`,
      userId: user.id,
      site,
      ip: (h.get("x-forwarded-for") ?? "").split(",")[0].trim(),
    });
    await db.order.update({ where: { id: order.id }, data: { extId: tx.tx } });
    url = tx.url;
  } catch {
    return { error: "Платёжная система сейчас не отвечает. Попробуй ещё раз через пару минут." };
  }
  redirect(url);
}
