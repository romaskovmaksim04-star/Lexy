import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

// The quiz wheel is drawn on the server and the result is signed, so the browser
// cannot pick its own discount. The token is checked again at sign-up.

export const SEGMENTS = [10, 25, 15, 50, 20, 30];
const WEIGHTS = [12, 26, 16, 6, 22, 18]; // percent chance of each segment
const TTL = 2 * 3_600_000;

function sign(body: string) {
  return createHmac("sha256", process.env.AUTH_SECRET || "lexy-dev-secret").update(`wheel|${body}`).digest("base64url").slice(0, 24);
}

export function drawWheel(): { index: number; percent: number; token: string } {
  let r = randomInt(100);
  let index = 0;
  for (let i = 0; i < WEIGHTS.length; i++) {
    r -= WEIGHTS[i];
    if (r < 0) { index = i; break; }
  }
  const body = `${SEGMENTS[index]}.${Date.now() + TTL}`;
  return { index, percent: SEGMENTS[index], token: `${body}.${sign(body)}` };
}

export function wheelDiscount(token: string | undefined | null): number {
  if (!token) return 0;
  const parts = token.split(".");
  if (parts.length !== 3) return 0;
  const [p, exp, sig] = parts;
  const want = sign(`${p}.${exp}`);
  if (want.length !== sig.length || !timingSafeEqual(Buffer.from(want), Buffer.from(sig))) return 0;
  if (Number(exp) < Date.now()) return 0;
  const percent = Number(p);
  return SEGMENTS.includes(percent) ? percent : 0;
}
