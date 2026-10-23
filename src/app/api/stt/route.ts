import { currentUser } from "@/lib/auth";
import { transcribe } from "@/lib/voice";
import { logCost } from "@/lib/costs";

// Speech-to-text for answers and Lexi turns. Quotas are charged by the action that
// scores the answer, not here, so a failed upload does not cost the user a check.
// "context" is what the student is answering; it helps the recogniser with topic words.
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "auth" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof Blob) || audio.size < 800) return Response.json({ error: "empty" }, { status: 400 });
  if (audio.size > 20 * 1024 * 1024) return Response.json({ error: "too-large" }, { status: 413 });
  const m = new URL(req.url).searchParams.get("mode");
  const mode = m === "accurate" || m === "chat" ? m : "fast";
  const context = String(form?.get("context") ?? "");
  try {
    const t = await transcribe(audio, mode, context);
    logCost("stt", t.cost);
    return Response.json(t);
  } catch {
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
