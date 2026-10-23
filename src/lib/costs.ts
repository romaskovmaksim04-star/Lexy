import "server-only";
import { db } from "./db";
import { todayKey } from "./profile";

// What the paid APIs cost, summed per day and purpose (llm:turn, llm:review, stt, tts…),
// so the price of a minute of Lexi is known from real use, not guessed.
// Fire and forget: accounting never slows or breaks a request.

export function logCost(purpose: string, rub: number | string | null | undefined): void {
  const v = typeof rub === "string" ? Number(rub) : rub;
  if (!v || !Number.isFinite(v) || v <= 0) return;
  const day = todayKey();
  db.cost
    .upsert({
      where: { day_purpose: { day, purpose } },
      create: { day, purpose, rub: v, count: 1 },
      update: { rub: { increment: v }, count: { increment: 1 } },
    })
    .catch(() => {});
}
