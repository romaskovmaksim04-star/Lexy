import { after } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { remaining, spend } from "@/lib/access";
import { logCost } from "@/lib/costs";
import { reportBug } from "@/lib/bug-report";
import { fromLiveService } from "@/lib/live";
import { finishConversation, writeReview } from "@/lib/lexi-server";
import { isMood } from "@/lib/voices";
import type * as engine from "@/lib/preppy/engine";

// Called by the live service (ai/live.py), never by a browser: the transcript of a finished
// live call, or a bug the student reported in it. The call ends here like any other: the
// student's talking time is charged, the quick review stored and the model's review written.

export const dynamic = "force-dynamic";

// A typed line costs the model and the voice too: it counts as this many seconds of talk
const TYPED_SECONDS = 10;

const fixSchema = z.object({ wrong: z.string().max(300), right: z.string().max(300), why: z.string().max(200) });
const turnSchema = z.object({
  role: z.enum(["user", "preppy"]),
  text: z.string().max(3000),
  words: z.number().int().min(0).max(2000).optional(),
  seconds: z.number().min(0).max(3600).optional(),
  typed: z.boolean().optional(),
  fix: fixSchema.nullish(),
  mood: z.string().max(20).optional(),
  interrupted: z.boolean().optional(),
});
const hookSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("done"), conv: z.string().max(40), turns: z.array(turnSchema).max(400), seconds: z.number().min(0).max(36000), cost: z.number().min(0).max(10000).optional() }),
  z.object({ kind: z.literal("bug"), conv: z.string().max(40), summary: z.string().max(600), context: z.string().max(4000).optional() }),
]);

export async function POST(req: Request) {
  if (!fromLiveService(req)) return Response.json({ error: "auth" }, { status: 401 });
  const parsed = hookSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad request" }, { status: 400 });
  const h = parsed.data;
  const conv = await db.conversation.findUnique({ where: { id: h.conv }, include: { user: true } });
  if (!conv) return Response.json({ error: "no call" }, { status: 404 });

  if (h.kind === "bug") {
    reportBug({ where: "call", summary: h.summary, who: conv.user.email, context: h.context, extra: `звонок ${conv.id}, ${conv.persona}, live` });
    return Response.json({ ok: true });
  }

  if (conv.endedAt) return Response.json({ ok: true });
  const turns: engine.Turn[] = h.turns.map((t) => ({
    role: t.role,
    text: t.text,
    ...(t.role === "user" ? { words: t.words ?? 0, seconds: t.seconds ?? 0, typed: t.typed || undefined, fix: t.fix ?? undefined } : {}),
    ...(t.role === "preppy" ? { mood: t.mood && isMood(t.mood) ? t.mood : "neutral", interrupted: t.interrupted || undefined } : {}),
  }));
  const typed = turns.filter((t) => t.role === "user" && t.typed).length;
  await db.conversation.update({ where: { id: conv.id }, data: { turns: JSON.stringify(turns), seconds: Math.round(h.seconds) } });
  // the last answer may run past the limit: what is left is charged, not more
  const charge = Math.min(Math.round(h.seconds) + typed * TYPED_SECONDS, await remaining(conv.user, "preppy_seconds"));
  if (charge > 0) await spend(conv.user, "preppy_seconds", charge);
  if (h.cost) logCost("live", h.cost);
  if (await finishConversation(conv.id)) {
    try {
      after(() => writeReview(conv.id));
    } catch {
      writeReview(conv.id).catch(() => {});
    }
  }
  return Response.json({ ok: true });
}
