"use server";

import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { chat, llmEnabled } from "@/lib/llm";
import { esc, notifyOwners } from "@/lib/notify";
import { reportBug } from "@/lib/bug-report";
import { PLANS } from "@/lib/pricing";

// Support chat: Lexi answers first from what the site really offers, and hands the whole
// conversation to the owners when she cannot help or the student asks for a human.

export type BotMessage = { role: "user" | "bot"; text: string };
export type BotReply = { text: string; handoff: boolean; error?: string };

const FACTS = `
ABOUT LexiUp
LexiUp is an online IELTS preparation platform (Academic and General Training): Listening, Reading, Writing and Speaking trainers in exam format, mock tests, AI feedback on essays and spoken answers, a vocabulary trainer with spaced repetition, a daily plan, progress statistics, and Lexi, a voice conversation partner with several characters (classic, kind, strict examiner, sarcastic, roast, bro, drama queen). LexiUp is not affiliated with British Council, IDP or Cambridge; tasks are original, in exam format.

PLANS (one-off payment for one month, no automatic renewals)
${PLANS.map((p) => `- ${p.name}: ${p.price} RUB/month. ${p.features.join("; ")}.`).join("\n")}
Payment: on the pricing page, through Platega (Russian cards, SBP). After payment Premium turns on automatically within a minute or two; if it did not after 10 minutes, a human must check (handoff).

GUARANTEE (Pro+ only): +1.0 overall band on the first official exam after the programme or the subscription money back. Conditions: starting score up to 6.5, 3 months of Pro+, 12 mock tests per section, 30 Writing and 30 Speaking AI checks. Claims are handled by a human (handoff).

REFUNDS: the refund policy page; any concrete refund request is handled by a human (handoff).

MICROPHONE TROUBLESHOOTING
- Allow microphone access: click the lock icon left of the address bar, set Microphone to Allow, reload.
- Check the right microphone is selected there and is not muted on the headset or in Windows/macOS sound settings.
- Close Discord, Zoom, Teams: they can hold the microphone.
- Best browsers: Chrome, Edge, Safari. In Telegram's in-app browser the microphone often does not work: open the site in a normal browser.
- In a call with Lexi you just talk; if it is noisy, switch to "press to talk".

ACCOUNT: sign in with email and password. There is no self-service password reset yet: a forgotten password is reset by a human (handoff). Delete account: Profile -> Delete account.
`;

const SYSTEM = `You are Lexi, the support assistant of LexiUp. Answer in Russian (unless the user writes in another language), short and friendly, 1 to 4 sentences, plain text without markdown. Use only the facts below; never invent prices, dates, features or promises.
Set "handoff": true when: the user asks for a human or an operator; the question is about a specific payment, refund, guarantee claim, bug that the troubleshooting steps did not fix, or anything you cannot answer from the facts. When you hand off, say that a person from the team will answer by email, usually within a working day.
When the user describes something on the site that is broken (an error, a page or button that does not work, the microphone or sound failing after the steps above, a wrong transcription, Premium not turning on after payment), also fill "bug": a short report in Russian for the developers (what happens, where, device or browser if known); tell the user you passed it to the team. Otherwise "bug" is "".
Return only JSON: {"text": "...", "handoff": false, "bug": ""}
${FACTS}`;

const historySchema = z.array(z.object({ role: z.enum(["user", "bot"]), text: z.string().max(2000) })).min(1).max(30);

export async function askSupport(history: BotMessage[]): Promise<BotReply> {
  const parsed = historySchema.safeParse(history);
  if (!parsed.success) return { text: "", handoff: false, error: "bad" };
  if (!llmEnabled()) return { text: "Сейчас я не могу ответить сама. Нажми «Позвать человека», и команда ответит на почту.", handoff: true };
  const raw = await chat(
    [{ role: "system", content: SYSTEM }, ...parsed.data.map((m) => ({ role: m.role === "bot" ? ("assistant" as const) : ("user" as const), content: m.text }))],
    { json: true, maxTokens: 350, temperature: 0.3 },
  );
  try {
    const start = raw?.indexOf("{") ?? -1;
    const j = JSON.parse(raw!.slice(start, raw!.lastIndexOf("}") + 1)) as { text?: string; handoff?: boolean; bug?: string };
    if (j.text?.trim() && typeof j.bug === "string" && j.bug.trim()) {
      const user = await currentUser();
      const who = user?.email ?? "гость";
      reportBug({ where: "support", summary: j.bug, who, context: parsed.data.slice(-8).map((m) => `${m.role === "user" ? "👤" : "🔥"} ${m.text}`).join("\n") });
    }
    if (j.text?.trim()) return { text: j.text.trim().slice(0, 1200), handoff: j.handoff === true };
  } catch {
    /* fall through */
  }
  return { text: "Что-то я задумалась и не смогла ответить. Нажми «Позвать человека», команда поможет.", handoff: true };
}

const handoffSchema = z.object({ email: z.string().trim().toLowerCase().email("Проверь email"), history: historySchema });

/** Sends the chat to the owners' Telegram and stores it as a ticket. */
export async function callHuman(input: { email: string; history: BotMessage[] }): Promise<{ ok: boolean; error?: string }> {
  const v = handoffSchema.safeParse(input);
  if (!v.success) return { ok: false, error: v.error.issues[0].message };
  const { email, history } = v.data;
  const recent = await db.ticket.count({ where: { email, createdAt: { gt: new Date(Date.now() - 3_600_000) } } });
  if (recent >= 5) return { ok: false, error: "Мы уже читаем твои сообщения, ответим скоро." };
  const user = await currentUser();
  const text = history.map((m) => `${m.role === "user" ? "👤" : "🔥"} ${m.text}`).join("\n");
  await db.ticket.create({ data: { email, topic: "other", text: text.slice(0, 3000), userId: user?.id } });
  notifyOwners(`🆘 зовут человека, <b>${esc(email)}</b>${user ? "" : " (не вошёл)"}:\n${esc(text.slice(-2500))}`);
  return { ok: true };
}
