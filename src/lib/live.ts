import "server-only";

// Client for the live-call service (ai/live.py): Lexi through Gemini Live, in real time.
// The web app opens a session there with the prompt and gets a one-time token, which the
// browser uses to connect its audio (WebRTC, or a WebSocket where UDP does not get through).

const LIVE_URL = process.env.LIVE_URL ?? "http://127.0.0.1:8766";
const AI_KEY = process.env.LEXY_AI_KEY ?? "";

/** Live calls need a Gemini key; LEXY_LIVE=0 switches back to the step-by-step call. */
export function liveEnabled(): boolean {
  return !!process.env.GEMINI_API_KEY && process.env.LEXY_LIVE !== "0";
}

export type LiveSession = {
  conv: string;
  prompt: string;
  /** Gemini voice name */
  voice: string;
  /** The app's note that starts the call */
  opening: string;
  /** Seconds the student may talk before Lexi says goodbye */
  seconds: number;
  /** Answers after which Lexi wraps up */
  turns: number;
  wrapup: string;
};

export async function openLive(s: LiveSession): Promise<string | null> {
  try {
    const res = await fetch(`${LIVE_URL}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(AI_KEY ? { "X-Lexy-Key": AI_KEY } : {}) },
      body: JSON.stringify(s),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return ((await res.json()) as { token?: string }).token ?? null;
  } catch {
    return null;
  }
}

/** The live service calls the web app back with the same key it is called with. */
export function fromLiveService(req: Request): boolean {
  return !!AI_KEY && req.headers.get("x-lexy-key") === AI_KEY;
}
