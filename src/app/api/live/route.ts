import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { remaining } from "@/lib/access";
import { liveEnabled, openLive } from "@/lib/live";
import { openConversation } from "@/lib/lexi-server";
import { LEXI_MAX_TURNS, LIVE_WRAPUP, liveOpening, systemPrompt } from "@/lib/preppy/lexi";

// Starts a live call with Lexi (Gemini Live): stores the conversation, opens a session in the
// live service and gives the page the token its audio connects with. {error: "off"} tells
// the page to use the step-by-step call (/api/lexi) instead.

export const dynamic = "force-dynamic";

const startSchema = z.object({
  start: z.object({
    persona: z.enum(["classic", "strict", "kind", "sarcastic", "roast", "bro", "drama"]),
    topic: z.string().max(40),
    topicTitle: z.string().max(200).optional(),
    voice: z.string().max(40),
    lang: z.enum(["mix", "en"]),
    swear: z.boolean(),
  }),
});

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "auth" }, { status: 401 });
  if (!liveEnabled()) return Response.json({ error: "off" }, { status: 404 });
  const start = startSchema.safeParse(await req.json().catch(() => null));
  if (!start.success) return Response.json({ error: "bad request" }, { status: 400 });
  const left = await remaining(user, "preppy_seconds");
  if (left <= 0) return Response.json({ error: "limit" }, { status: 429 });

  const { conv, settings, voice, topicId } = await openConversation(user, start.data.start);
  const token = await openLive({
    conv: conv.id,
    prompt: systemPrompt(settings, topicId, true),
    voice: voice.replace(/^g:/, ""),
    opening: liveOpening(),
    seconds: left,
    turns: settings.flavor?.turns ?? LEXI_MAX_TURNS,
    wrapup: LIVE_WRAPUP,
  });
  if (!token) {
    // the live service is down: nothing was said, so no empty call is left behind
    await db.conversation.delete({ where: { id: conv.id } }).catch(() => {});
    return Response.json({ error: "off" }, { status: 503 });
  }
  return Response.json({ conv: conv.id, token, female: settings.female !== false });
}
