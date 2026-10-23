import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { GEMINI_VOICE_IDS, type Mood } from "./voices";

// Client for the speech service (ai/server.py) and signing of text-to-speech links.
// A TTS link is only valid for text the server itself put on a page, so the endpoint
// cannot be used as a free voice for arbitrary text.

const AI_URL = process.env.AI_URL ?? "http://127.0.0.1:8765";
const AI_KEY = process.env.LEXY_AI_KEY ?? "";

export type Voice = "examiner" | "female" | "male" | "female2" | "male2" | "preppy";
export const VOICES: Voice[] = ["examiner", "female", "male", "female2", "male2", "preppy"];

/** Content voices above, or "g:<Gemini voice>" for Lexi with a voice the user picked. */
export function validVoice(v: string): boolean {
  return (VOICES as string[]).includes(v) || (v.startsWith("g:") && GEMINI_VOICE_IDS.has(v.slice(2)));
}

export type TtsOptions = { rate?: "medium" | "slow"; mood?: Mood; style?: string };

function secret() {
  return process.env.AUTH_SECRET || "lexy-dev-secret";
}

function payload(text: string, voice: string, rate: string, mood: string, style: string) {
  return `tts|${voice}|${rate}|${mood}|${style}|${text}`;
}

export function signTts(text: string, voice: string = "examiner", rateOrOpts: "medium" | "slow" | TtsOptions = "medium"): string {
  const o: TtsOptions = typeof rateOrOpts === "string" ? { rate: rateOrOpts } : rateOrOpts;
  const rate = o.rate ?? "medium";
  const mood = o.mood ?? "neutral";
  const style = o.style ?? "";
  const sig = createHmac("sha256", secret()).update(payload(text, voice, rate, mood, style)).digest("base64url").slice(0, 22);
  const q = new URLSearchParams({ t: text, v: voice, s: sig });
  if (rate === "slow") q.set("r", "slow");
  if (mood !== "neutral") q.set("m", mood);
  if (style) q.set("c", style);
  return `/api/tts?${q.toString()}`;
}

export function verifyTts(text: string, voice: string, rate: string, mood: string, style: string, sig: string): boolean {
  const want = createHmac("sha256", secret()).update(payload(text, voice, rate, mood, style)).digest("base64url").slice(0, 22);
  const a = Buffer.from(want);
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

function headers(extra: Record<string, string> = {}) {
  return AI_KEY ? { "X-Lexy-Key": AI_KEY, ...extra } : extra;
}

export type Transcript = {
  text: string;
  duration: number;
  /** Seconds of actual speech (voice activity), pauses excluded */
  speech?: number;
  language?: string;
  words: { w: string; s: number; e: number; p: number }[];
  took: number;
  cost?: number;
};

export async function transcribe(audio: Blob, mode: "fast" | "accurate" | "chat", context = ""): Promise<Transcript> {
  const form = new FormData();
  form.append("audio", audio, audio instanceof File && audio.name ? audio.name : "answer.webm");
  if (context) form.append("context", context.slice(0, 300));
  const res = await fetch(`${AI_URL}/stt?mode=${mode}`, {
    method: "POST",
    body: form,
    headers: headers(),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw new Error(`stt ${res.status}`);
  return res.json();
}

export async function synthesize(text: string, voice: string, rate: string, mood = "neutral", style = ""): Promise<Response> {
  return fetch(`${AI_URL}/tts`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ text, voice, rate, mood, style }),
    signal: AbortSignal.timeout(60_000),
  });
}

export async function speechServiceUp(): Promise<boolean> {
  try {
    const res = await fetch(`${AI_URL}/health`, { signal: AbortSignal.timeout(1500), cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}
