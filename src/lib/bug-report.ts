import "server-only";
import { esc, notifyOwners } from "@/lib/notify";

// Bug reports Lexi files herself (in a call or in the support chat) when a student says
// something on the site is broken. They go to the owners' Telegram through the notice bot.
// A few per user per hour at most, and the same text only once, so a looping model or an
// angry student can't flood the chat.

const sent = new Map<string, number[]>();
const seen = new Map<string, number>();
const HOUR = 3_600_000;

export function reportBug(r: { where: "call" | "support"; summary: string; who: string; context?: string; extra?: string }): boolean {
  const summary = r.summary.replace(/\s+/g, " ").trim().slice(0, 600);
  if (summary.length < 6) return false;
  const now = Date.now();
  const times = (sent.get(r.who) ?? []).filter((t) => now - t < HOUR);
  const key = `${r.who}|${summary.toLowerCase().slice(0, 80)}`;
  if (times.length >= 3 || now - (seen.get(key) ?? 0) < HOUR) return false;
  times.push(now);
  sent.set(r.who, times);
  seen.set(key, now);
  const where = r.where === "call" ? "звонок с Lexi" : "чат поддержки";
  notifyOwners(
    `🐞 <b>баг-репорт</b> (${where}) от <b>${esc(r.who)}</b>\n${esc(summary)}` +
      (r.extra ? `\n<i>${esc(r.extra.slice(0, 300))}</i>` : "") +
      (r.context ? `\n\n${esc(r.context.slice(-1500))}` : ""),
  );
  return true;
}
