const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") || "";
const POLZA = Deno.env.get("POLZA_API_KEY") || "";
const MODEL = Deno.env.get("AI_MODEL") || "deepseek/deepseek-chat";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};
function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" } });
}
function svc(extra: Record<string, string> = {}) {
  return { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json", ...extra };
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
async function rest(path: string, init: RequestInit = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: svc((init.headers as Record<string, string>) || {}) });
  const t = await r.text();
  let d: any = null;
  try { d = t ? JSON.parse(t) : null; } catch { d = t; }
  if (!r.ok) { const e: any = new Error("rest " + r.status); e.status = r.status; e.data = d; throw e; }
  return d;
}
const LEVELS: Record<string, string> = { A1: "absolute beginner (A1)", A2: "elementary (A2)", B1: "intermediate (B1)", B2: "upper-intermediate (B2)", C1: "advanced (C1)" };
function today() { return new Date().toISOString().slice(0, 10); }

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const u = await getUser(req);
  if (!u) return json({ error: "unauthorized" }, 401);

  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const mode = body.mode || "chat";
  const level = body.level || "B1";
  const lvl = LEVELS[level] || level;

  let prof: any = {};
  try { const rows = await rest(`profiles?id=eq.${encodeURIComponent(u.id)}&select=plan,path,target&limit=1`); prof = (rows && rows[0]) || {}; } catch { prof = {}; }
  const plan = prof.plan || "free";

  const day = today();
  let usage: any = { chat_tokens: 0, writing_count: 0 };
  try { const rows = await rest(`ai_usage?user_id=eq.${encodeURIComponent(u.id)}&day=eq.${day}&select=*`); if (rows && rows[0]) usage = rows[0]; } catch { usage = { chat_tokens: 0, writing_count: 0 }; }

  const CHAT_BUDGET = plan === "pro_plus" ? 160000 : plan === "pro" ? 60000 : 0;
  const WRITE_LIMIT = plan === "pro_plus" ? 6 : plan === "pro" ? 2 : 0;

  if (mode === "writing-check") {
    if (WRITE_LIMIT === 0) return json({ error: "premium_required" }, 403);
    if ((usage.writing_count || 0) >= WRITE_LIMIT) return json({ error: "limit", limit: WRITE_LIMIT }, 429);
  } else {
    if (CHAT_BUDGET === 0) return json({ error: "premium_required" }, 403);
    if ((usage.chat_tokens || 0) >= CHAT_BUDGET) return json({ error: "limit" }, 429);
  }

  async function ai(messages: any[], opts: any = {}) {
    const r = await fetch("https://api.polza.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${POLZA}` },
      body: JSON.stringify({ model: MODEL, messages, temperature: opts.temperature ?? 0.7, max_tokens: opts.max_tokens ?? 600, ...(opts.json ? { response_format: { type: "json_object" } } : {}) }),
    });
    const t = await r.text();
    let d: any = null;
    try { d = t ? JSON.parse(t) : null; } catch { d = null; }
    if (!r.ok) { const e: any = new Error("ai " + r.status); e.status = r.status; e.data = d; throw e; }
    return d;
  }
  async function bump(patch: Record<string, unknown>) {
    try { await rest("ai_usage?on_conflict=user_id,day", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify([{ user_id: u.id, day, ...patch }]) }); } catch (e) { console.error("bump", (e as any).status); }
  }

  const exam = body.exam !== false;

  try {
    if (mode === "writing-topic") {
      const sys = exam
        ? "You are an IELTS examiner. Reply ONLY with a single IELTS Academic Task 2 essay question suitable for a " + lvl + " learner. No extra text."
        : "You are a friendly English writing coach. Reply ONLY with one short writing task (a paragraph, email or short article) suitable for a " + lvl + " learner, 1-2 sentences. No extra text.";
      const d = await ai([{ role: "system", content: sys }, { role: "user", content: "Give me one writing task." }], { temperature: 0.9, max_tokens: 140 });
      const topic = (d?.choices?.[0]?.message?.content || "").trim();
      await bump({ chat_tokens: (usage.chat_tokens || 0) + (d?.usage?.total_tokens || 0) });
      return json({ ok: true, topic });
    }

    if (mode === "writing-check") {
      const sys = exam
        ? "You are a strict but fair IELTS examiner. Evaluate the essay for the given task. Reply ONLY with JSON: {\"band\": number 0-9, \"summary\": string, \"strengths\": [strings], \"improvements\": [strings], \"corrections\": [strings]}. Band follows IELTS Task 2 criteria."
        : "You are a friendly English writing tutor. Evaluate the text for a " + lvl + " learner. Reply ONLY with JSON: {\"band\": string (CEFR level estimate: A1, A2, B1, B2 or C1), \"summary\": string, \"strengths\": [strings], \"improvements\": [strings], \"corrections\": [strings]}. Be encouraging but honest.";
      const usr = "Task: " + (body.topic || "") + "\n\nText:\n" + (body.essay || "");
      const d = await ai([{ role: "system", content: sys }, { role: "user", content: usr }], { temperature: 0.3, max_tokens: 900, json: true });
      const content = d?.choices?.[0]?.message?.content || "{}";
      let parsed: any = {};
      try { parsed = JSON.parse(content); } catch { parsed = { band: null, summary: content, strengths: [], improvements: [], corrections: [] }; }
      const tokens = d?.usage?.total_tokens || 0;
      await bump({ chat_tokens: (usage.chat_tokens || 0) + tokens, writing_count: (usage.writing_count || 0) + 1 });
      try {
        await rest("writing_results", { method: "POST", body: JSON.stringify([{ user_id: u.id, topic: body.topic || "", essay: body.essay || "", band: typeof parsed.band === "number" ? parsed.band : null, summary: parsed.summary || "", feedback: { exam: exam, level: typeof parsed.band === "string" ? parsed.band : null, strengths: parsed.strengths || [], improvements: parsed.improvements || [], corrections: parsed.corrections || [] } }]) });
      } catch (e) { console.error("save writing", (e as any).status); }
      return json({ ok: true, result: parsed, exam: exam, remaining: WRITE_LIMIT - ((usage.writing_count || 0) + 1) });
    }

    const sys = "You are Lexy, an English tutor for a " + lvl + " learner. Analyze the learner's LAST message for grammar, spelling and word choice. Reply ONLY with JSON: {\"correct\": true|false, \"explanation\": string (short reason in the learner's language; empty if correct), \"corrected\": string (the corrected version of the last message with the same meaning), \"reply\": string (a short natural conversational reply in English, 1-2 sentences, ending with a question)}.";
    const history = (Array.isArray(body.messages) ? body.messages : []).filter(function (m) { return m && (m.role === "user" || m.role === "assistant"); }).slice(-12);
    const messages = [{ role: "system", content: sys }].concat(history);
    const d = await ai(messages, { temperature: 0.6, max_tokens: 500, json: true });
    const content = d?.choices?.[0]?.message?.content || "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch { parsed = { correct: true, explanation: "", corrected: "", reply: content }; }
    const tokens = d?.usage?.total_tokens || 0;
    await bump({ chat_tokens: (usage.chat_tokens || 0) + tokens });
    return json({ ok: true, reply: parsed.reply || "", grammar: { correct: parsed.correct !== false, explanation: parsed.explanation || "", corrected: parsed.corrected || "" }, remaining: CHAT_BUDGET - ((usage.chat_tokens || 0) + tokens) });
  } catch (e) {
    return json({ error: "ai", message: String((e as any)?.message || e) }, 502);
  }
});
