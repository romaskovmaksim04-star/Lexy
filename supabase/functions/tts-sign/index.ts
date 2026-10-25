// tts-sign — подписывает ссылки на TTS GoLexi (их /api/tts) их AUTH_SECRET.
// Контракт подписи (lib/voice.ts): HMAC-SHA256(secret, "tts|voice|rate|mood|style|text"),
// base64url, первые 22 символа. Клиент просит готовые audio-URL для строк Listening.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") || "";
const AUTH_SECRET = Deno.env.get("AUTH_SECRET") || "";
const TTS_BASE = Deno.env.get("GOLEXI_TTS_BASE") || "https://lexy.ghostlynex.fun/api/tts";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};
function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" } });
}
async function getUser(req: Request) {
  const h = req.headers.get("Authorization") || "";
  const token = h.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: ANON, Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  const u = await r.json();
  return u && u.id ? u : null;
}
function b64url(bytes: Uint8Array) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function sign(text: string, voice: string) {
  const payload = `tts|${voice}|medium|neutral||${text}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(AUTH_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
  const s = b64url(sig).slice(0, 22);
  const q = new URLSearchParams({ t: text, v: voice, s });
  return `${TTS_BASE}?${q.toString()}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!AUTH_SECRET) return json({ error: "no_secret" }, 503);
  const u = await getUser(req);
  if (!u) return json({ error: "auth" }, 401);

  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const items = (Array.isArray(body.items) ? body.items : []).slice(0, 80).map((it: any) => ({
    text: String(it && it.text || "").slice(0, 1200),
    voice: String(it && it.voice || "examiner"),
  }));
  if (!items.length) return json({ audio: [] });
  const audio: string[] = [];
  for (const it of items) audio.push(it.text ? await sign(it.text, it.voice) : "");
  return json({ audio });
});
