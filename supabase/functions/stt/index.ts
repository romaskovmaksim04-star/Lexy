// stt — прокси к Whisper GoLexi (их /stt). Принимает multipart audio от браузера,
// шлёт на их сервис с X-Lexy-Key (секрет), возвращает их JSON-транскрипт.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") || "";
const LEXY_AI_KEY = Deno.env.get("LEXY_AI_KEY") || "";
const STT_URL = Deno.env.get("GOLEXI_STT_URL") || "https://lexy.ghostlynex.fun/stt";

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!LEXY_AI_KEY) return json({ error: "no_key" }, 503);
  const u = await getUser(req);
  if (!u) return json({ error: "auth" }, 401);

  const mode = new URL(req.url).searchParams.get("mode") || "accurate";
  let form: FormData | null = null;
  try { form = await req.formData(); } catch { form = null; }
  const audio = form ? form.get("audio") : null;
  if (!(audio instanceof Blob) || audio.size < 600) return json({ error: "empty" }, 400);
  if (audio.size > 25 * 1024 * 1024) return json({ error: "too-large" }, 413);
  const context = String((form && form.get("context")) || "").slice(0, 300);

  const fd = new FormData();
  const name = audio instanceof File && audio.name ? audio.name : "answer.webm";
  fd.append("audio", audio, name);
  if (context) fd.append("context", context);

  try {
    const r = await fetch(`${STT_URL}?mode=${encodeURIComponent(mode)}`, {
      method: "POST",
      headers: { "X-Lexy-Key": LEXY_AI_KEY },
      body: fd,
      signal: AbortSignal.timeout(175000),
    });
    const text = await r.text();
    return new Response(text, { status: r.status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" } });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
});
