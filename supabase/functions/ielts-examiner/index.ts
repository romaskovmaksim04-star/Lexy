// ielts-examiner — ИИ-экзаменатор Writing/Speaking по критериям IELTS.
// Порт LexiUp src/lib/examiner.ts на Polza (OpenAI-совместимый API).
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
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
async function getUser(req: Request) {
  const h = req.headers.get("Authorization") || "";
  const token = h.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: ANON, Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  const u = await r.json();
  return u && u.id ? u : null;
}

/* ---------- ported from examiner.ts ---------- */
const WRITING_CRITERIA = (task: "task1" | "task2") => [
  { key: "tr", title: task === "task2" ? "Task Response" : "Task Achievement" },
  { key: "cc", title: "Coherence & Cohesion" },
  { key: "lr", title: "Lexical Resource" },
  { key: "gr", title: "Grammatical Range & Accuracy" },
];
const SPEAKING_CRITERIA = [
  { key: "fc", title: "Fluency & Coherence" },
  { key: "lr", title: "Lexical Resource" },
  { key: "gr", title: "Grammatical Range & Accuracy" },
];
const COMMON = `Write every comment in Russian, informal «ты», concrete and kind but honest: quote the student's own words when you point at something. Be calibrated like a real IELTS examiner: most learners are 5.0-6.5; do not inflate. Bands are whole or half (5.0, 5.5). Return only JSON.`;

function writingMessages(input: { task: "task1" | "task2"; kind: "essay" | "report" | "letter"; prompt: string; chart?: unknown; text: string; words: number; flagged: string[] }) {
  const min = input.task === "task2" ? 250 : 150;
  const crit = WRITING_CRITERIA(input.task);
  const system = `You are an experienced IELTS Writing examiner marking ${input.task === "task2" ? "a Task 2 essay" : input.kind === "letter" ? "a General Training Task 1 letter" : "an Academic Task 1 report"}.
Band descriptors in brief:
- ${crit[0].title}: ${input.task === "task2" ? "addresses all parts of the question, a clear position throughout, ideas extended and supported" : input.kind === "letter" ? "covers all bullet points, clear purpose, consistent and appropriate tone" : "a clear overview of the main trends, key features selected and compared, accurate data"}.
- Coherence & Cohesion: logical organisation, paragraphing, cohesive devices used naturally (not mechanically), clear referencing.
- Lexical Resource: range, precision, collocations, less common vocabulary; spelling and word-formation errors.
- Grammatical Range & Accuracy: mix of simple and complex structures, how many sentences are error-free.
Under ${min} words is penalised in ${crit[0].title}; off-topic or memorised text is capped low.
${COMMON}
JSON shape:
{"criteria": {"${crit.map((c) => c.key).join('": {"band": 6.0, "notes": ["2-3 concrete notes"]}, "')}": {"band": 6.0, "notes": ["..."]}},
 "summary": "2-3 sentences: the overall picture and the single most important thing to fix",
 "mistakes": [{"wrong": "exact words from the text", "right": "corrected", "why": "short rule"}],
 "rewrite": {"original": "the weakest paragraph or sentence group, copied exactly", "improved": "the same ideas at band 7.5+"},
 "next": ["concrete step to get +0.5", "..."]}
Limits: mistakes 0-10 (the most important first, real ones only), next 2-3.`;
  const user = `TASK
${input.prompt}${input.chart ? `\n\nTHE CHART'S DATA (what the student saw as a picture)\n${JSON.stringify(input.chart).slice(0, 2500)}` : ""}

STUDENT'S ANSWER (${input.words} words)
${input.text}${input.flagged.length ? `\n\nAn automatic checker flagged (may be wrong): ${input.flagged.slice(0, 12).join("; ")}` : ""}`;
  return [{ role: "system", content: system }, { role: "user", content: user }];
}

function speakingMessages(input: { part: number; topic: string; parts: { question: string; text: string; seconds: number }[]; wpm: number; hesitations: number | null; fillers: number }) {
  const system = `You are an experienced IELTS Speaking examiner marking a Part ${input.part} answer from its transcript.
Band descriptors in brief:
- Fluency & Coherence: speaks at length without noticeable effort, little hesitation or self-correction, ideas linked and developed (Part 2: talks for the full time and covers the card).
- Lexical Resource: range and precision, idiomatic language, paraphrase when needed.
- Grammatical Range & Accuracy: complex structures, how many utterances are error-free.
Pronunciation is measured separately by the app: do not mark it.
The transcript comes from speech recognition: ignore punctuation and capitalisation, and do not count words that are obviously recognition errors.
Measured by the app: ${input.wpm} words per minute, ${input.hesitations ?? "unknown"} hesitation pauses, ${input.fillers} filler words (um, uh, like…).
${COMMON}
JSON shape:
{"criteria": {"fc": {"band": 6.0, "notes": ["2-3 concrete notes"]}, "lr": {"band": 6.0, "notes": ["..."]}, "gr": {"band": 6.0, "notes": ["..."]}},
 "summary": "2-3 sentences: the overall picture and the single most important thing to fix",
 "mistakes": [{"wrong": "exact words from the transcript", "right": "corrected", "why": "short rule"}],
 "rewrite": {"original": "the weakest answer, as said", "improved": "the same ideas as a band 7.5+ speaker would say them, natural spoken English"},
 "next": ["concrete step to get +0.5", "..."]}
Limits: mistakes 0-8 (real ones only), next 2-3.`;
  const user = `Topic: ${input.topic}\n\n${input.parts.map((p, i) => `Q${i + 1}: ${p.question.split("\n")[0]}\nA${i + 1} (${Math.round(p.seconds)} s): ${p.text || "(no answer)"}`).join("\n\n")}`;
  return [{ role: "system", content: system }, { role: "user", content: user }];
}

const str = (v: unknown, max = 400) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const band = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 1 && n <= 9 ? Math.round(n * 2) / 2 : null;
};
function parseExaminer(raw: string | null, criteria: { key: string; title: string }[]) {
  if (!raw) return null;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let j: Record<string, unknown>;
  try { j = JSON.parse(raw.slice(start, end + 1)); } catch { return null; }
  const cj = (j.criteria ?? {}) as Record<string, { band?: unknown; notes?: unknown }>;
  const out: { key: string; title: string; band: number; notes: string[] }[] = [];
  for (const c of criteria) {
    const b = band(cj[c.key]?.band);
    if (b === null) return null;
    const notes = (Array.isArray(cj[c.key]?.notes) ? (cj[c.key].notes as unknown[]) : []).map((n) => str(n, 300)).filter(Boolean).slice(0, 4);
    out.push({ key: c.key, title: c.title, band: b, notes });
  }
  const mean = out.reduce((a, c) => a + c.band, 0) / out.length;
  const mistakes = (Array.isArray(j.mistakes) ? j.mistakes : [])
    .map((m) => m as Record<string, unknown>)
    .filter((m) => str(m?.wrong) && str(m?.right) && str(m.wrong).toLowerCase() !== str(m.right).toLowerCase())
    .slice(0, 10)
    .map((m) => ({ wrong: str(m.wrong, 200), right: str(m.right, 200), why: str(m.why, 200) }));
  const rw = j.rewrite as Record<string, unknown> | undefined;
  return {
    v: 1,
    band: Math.floor(mean * 2 + 0.5) / 2,
    criteria: out,
    summary: str(j.summary, 700),
    mistakes,
    rewrite: str(rw?.original) && str(rw?.improved) ? { original: str(rw!.original, 1500), improved: str(rw!.improved, 2000) } : undefined,
    next: (Array.isArray(j.next) ? j.next : []).map((n) => str(n, 300)).filter(Boolean).slice(0, 3),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const u = await getUser(req);
  if (!u) return json({ error: "unauthorized" }, 401);
  if (!POLZA) return json({ error: "no_key" }, 503);

  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const kind = body.kind === "speaking" ? "speaking" : "writing";

  let messages: any[] = [], criteria: { key: string; title: string }[] = [];
  if (kind === "writing") {
    const task: "task1" | "task2" = body.task === "task1" ? "task1" : "task2";
    const k = body.format === "general" && task === "task1" ? "letter" : task === "task2" ? "essay" : "report";
    const text = String(body.text || "").slice(0, 12000);
    if (text.trim().length < 20) return json({ error: "too_short" }, 400);
    messages = writingMessages({ task, kind: k, prompt: String(body.prompt || "").slice(0, 4000), chart: body.chart, text, words: Number(body.words) || text.trim().split(/\s+/).length, flagged: Array.isArray(body.flagged) ? body.flagged.slice(0, 12).map(String) : [] });
    criteria = WRITING_CRITERIA(task);
  } else {
    const parts = (Array.isArray(body.parts) ? body.parts : []).slice(0, 6).map((p: any) => ({ question: String(p?.question || "").slice(0, 400), text: String(p?.text || "").slice(0, 4000), seconds: Number(p?.seconds) || 0 }));
    if (!parts.some((p: any) => p.text.trim().length > 3)) return json({ error: "too_short" }, 400);
    messages = speakingMessages({ part: Number(body.part) || 2, topic: String(body.topic || "").slice(0, 120), parts, wpm: Number(body.wpm) || 0, hesitations: body.hesitations ?? null, fillers: Number(body.fillers) || 0 });
    criteria = SPEAKING_CRITERIA;
  }

  async function ai(msgs: any[]) {
    const r = await fetch("https://api.polza.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${POLZA}` },
      body: JSON.stringify({ model: MODEL, messages: msgs, temperature: 0.2, max_tokens: 2200, response_format: { type: "json_object" } }),
    });
    const t = await r.text();
    try { const d = t ? JSON.parse(t) : null; return d?.choices?.[0]?.message?.content ?? null; } catch { return null; }
  }

  let examiner = null;
  for (let i = 0; i < 2 && !examiner; i++) examiner = parseExaminer(await ai(messages), criteria);
  if (!examiner) return json({ error: "examiner_failed" }, 502);
  return json({ examiner, kind });
});
