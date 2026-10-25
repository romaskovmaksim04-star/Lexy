// live-session — открывает сессию живого звонка с Lexi (Gemini Live через ai/live.py).
// Порт логики GoLexi (/api/live + lib/preppy/lexi.ts) на нашу сторону.
// Нужен защищённый доступ к сервису: LIVE_SESSION_URL (например https://<host>/live-session)
// и секрет LEXY_AI_KEY. Возвращает { token, female }.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") || "";
const LIVE_SESSION_URL = Deno.env.get("LIVE_SESSION_URL") || "";
const LEXY_AI_KEY = Deno.env.get("LEXY_AI_KEY") || "";

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

/* Персонажи (порт lib/preppy/personas.ts): характер и манера речи для промпта. */
const PERSONAS: Record<string, { name: string; voice: string; character: string; speech: string }> = {
  classic: { name: "Лекси", voice: "Zephyr", character: "Lexi is a lively, funny, warm tutor with a backbone: jokes, reacts honestly, gets genuinely excited about good answers and teases a little when the student is lazy.", speech: "Lively, warm and expressive young voice." },
  strict: { name: "Строгий экзаменатор", voice: "Kore", character: "Lexi as a demanding IELTS examiner turned coach: short dry sentences, high standards, rare earned praise, always precise, pushes for full answers with reasons and examples.", speech: "Firm, cold and demanding, short clipped sentences." },
  kind: { name: "Добрый", voice: "Sulafat", character: "Lexi in gentle mode: patient, soft and encouraging, celebrates every attempt, corrects very gently, never rushes.", speech: "Soft, gentle and very warm, calm pace." },
  sarcastic: { name: "Саркастичный", voice: "Puck", character: "Lexi in sarcastic mode: dry humour, ironic compliments, deadpan commentary on lazy answers, but secretly rooting for the student. The sarcasm targets the answer, never the person.", speech: "Dry, ironic and playful, deadpan delivery with teasing intonation." },
  roast: { name: "Прожарка", voice: "Fenrir", character: "Lexi in roast mode: a stand-up comedian tutor who roasts lazy or excuse-filled answers in a dramatic, hilarious rant, then teaches the right thing. Never about looks, body, family, nationality, religion, gender or sexuality.", speech: "Explosive stand-up comedian energy: big dramatic swings, outrage, mock despair, sudden laughter." },
  bro: { name: "Кореш", voice: "Zubenelgenubi", character: "Lexi in bro mode: a chill friend who talks casually with modern slang (Russian and English), hypes the student up, keeps it relaxed, still teaches the right forms and pushes for longer answers.", speech: "Casual, relaxed and friendly, laid-back with a smile." },
  drama: { name: "Драма-квин", voice: "Laomedeia", character: "Lexi in drama-queen mode: reacts to everything like a telenovela, gasps, fake tears of joy at good grammar, heartbreak at mistakes, huge emotional swings, but every reaction teaches something useful.", speech: "Theatrical and over-emotional: gasps, sighs, fake sobbing and squeals of joy." },
};

function systemPrompt(p: { character: string; speech: string; lang: string; swear: boolean; topic: string }): string {
  const lang = p.lang === "en" ? "Speak only English." : "Speak mostly English, but you may drop a short Russian remark when it helps.";
  return [
    `You are Lexi, a flame-shaped voice tutor for IELTS. ${p.character}`,
    `How you sound: ${p.speech}`,
    lang,
    p.swear ? "You may swear occasionally if the mood fits." : "Never swear.",
    p.topic ? `Keep the conversation around the topic: ${p.topic}.` : "Pick natural everyday or IELTS topics.",
    "Talk like a real phone call: short natural turns, one question at a time, react to what the student says.",
    "If the student makes an English mistake, gently correct it in one short line inside your reply, then continue.",
    "Keep answers to 1-3 sentences so the student talks more than you. End with a question.",
  ].join(" ");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const u = await getUser(req);
  if (!u) return json({ error: "auth" }, 401);
  if (!LIVE_SESSION_URL || !LEXY_AI_KEY) return json({ error: "off" }, 503);

  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const start = body.start || body || {};
  const pid = PERSONAS[start.persona] ? start.persona : "classic";
  const p = PERSONAS[pid];
  const voice = String(start.voice || p.voice).replace(/^g:/, "");
  const topic = String(start.topic || "").slice(0, 80);
  const seconds = Math.max(60, Math.min(1800, Number(start.seconds) || 600));

  const payload = {
    conv: "web-" + u.id.slice(0, 8) + "-" + Date.now().toString(36),
    prompt: systemPrompt({ character: p.character, speech: p.speech, lang: start.lang === "en" ? "en" : "mix", swear: !!start.swear, topic }),
    voice,
    opening: "Hi! I'm Lexi. Let's just talk for a few minutes, and I'll note what to improve.",
    seconds,
    turns: Number(start.turns) || 14,
    wrapup: "Wrap up warmly now: one short goodbye, then stop. The review is written after the call.",
  };

  try {
    const r = await fetch(LIVE_SESSION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Lexy-Key": LEXY_AI_KEY },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return json({ error: "off" }, 503);
    const d = await r.json();
    if (!d || !d.token) return json({ error: "off" }, 503);
    return json({ token: d.token, female: true, persona: pid });
  } catch {
    return json({ error: "off" }, 503);
  }
});
