"use server";

import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { esc, notifyOwners } from "@/lib/notify";

export type TicketState = { ok?: boolean; email?: string; error?: string } | undefined;

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Проверь email"),
  topic: z.enum(["payment", "speaking", "account", "guarantee", "other"]).default("other"),
  text: z.string().trim().min(10, "Опиши проблему чуть подробнее").max(3000),
});

const TOPIC_RU: Record<string, string> = { payment: "оплата", speaking: "микрофон", account: "аккаунт", guarantee: "гарантия", other: "другое" };

export async function sendTicket(_: TicketState, form: FormData): Promise<TicketState> {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, topic, text } = parsed.data;
  // At most five messages an hour from one address
  const recent = await db.ticket.count({ where: { email, createdAt: { gt: new Date(Date.now() - 3_600_000) } } });
  if (recent >= 5) return { error: "Слишком много сообщений подряд. Мы уже читаем предыдущие, ответим скоро." };
  const user = await currentUser();
  await db.ticket.create({ data: { email, topic, text, userId: user?.id } });
  notifyOwners(`✉️ поддержка (${TOPIC_RU[topic]}) от <b>${esc(email)}</b>${user ? "" : " (не вошёл)"}:\n${esc(text.slice(0, 1500))}`);
  return { ok: true, email };
}
