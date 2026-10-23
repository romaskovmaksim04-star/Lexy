import { synthesize, validVoice, verifyTts } from "@/lib/voice";
import { isMood } from "@/lib/voices";
import { persona } from "@/lib/preppy/personas";
import { logCost } from "@/lib/costs";

// Serves examiner, dialogue and Lexi voices for text the server signed (see signTts).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const text = url.searchParams.get("t") ?? "";
  const voice = url.searchParams.get("v") ?? "examiner";
  const rate = url.searchParams.get("r") === "slow" ? "slow" : "medium";
  const mood = url.searchParams.get("m") ?? "neutral";
  const style = url.searchParams.get("c") ?? "";
  const sig = url.searchParams.get("s") ?? "";
  // A voice is only made for real words (a stray "<m" once came out as a made-up sentence)
  if (!text || !/[\p{L}]{2}/u.test(text) || /^</.test(text.trim()) || text.length > 1200 || !validVoice(voice) || !isMood(mood) || !verifyTts(text, voice, rate, mood, style, sig)) {
    return new Response("bad request", { status: 400 });
  }
  try {
    // The character's manner of speaking goes to the voice as an instruction
    const res = await synthesize(text, voice, rate, mood, style ? persona(style).speech : "");
    if (!res.ok || !res.body) return new Response("voice unavailable", { status: 503 });
    logCost("tts", res.headers.get("x-cost-rub"));
    return new Response(res.body, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": res.headers.get("cache-control") ?? "no-store" },
    });
  } catch {
    return new Response("voice unavailable", { status: 503 });
  }
}
