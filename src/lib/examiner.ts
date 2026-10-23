// The examiner: a language model that marks Writing and Speaking answers by the IELTS band
// descriptors, on top of the automatic analysis (which stays as the fallback and still
// marks the essay inline). Pure functions (prompt and parsing), tested without the API.

export type ExCriterion = { key: string; title: string; band: number; notes: string[] };

export type Examiner = {
  v: 1;
  band: number;
  criteria: ExCriterion[];
  summary: string;
  mistakes: { wrong: string; right: string; why: string }[];
  rewrite?: { original: string; improved: string };
  next: string[];
};

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

export function writingMessages(input: { task: "task1" | "task2"; kind: "essay" | "report" | "letter"; prompt: string; chart?: unknown; text: string; words: number; flagged: string[] }) {
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
${input.prompt}${input.chart ? `

THE CHART'S DATA (what the student saw as a picture)
${JSON.stringify(input.chart).slice(0, 2500)}` : ""}

STUDENT'S ANSWER (${input.words} words)
${input.text}${input.flagged.length ? `\n\nAn automatic checker flagged (may be wrong): ${input.flagged.slice(0, 12).join("; ")}` : ""}`;
  return [{ role: "system" as const, content: system }, { role: "user" as const, content: user }];
}

export function speakingMessages(input: { part: number; topic: string; parts: { question: string; text: string; seconds: number }[]; wpm: number; hesitations: number | null; fillers: number }) {
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
  return [{ role: "system" as const, content: system }, { role: "user" as const, content: user }];
}

const str = (v: unknown, max = 400) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const band = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 1 && n <= 9 ? Math.round(n * 2) / 2 : null;
};

/** Reads the examiner's JSON; null when unusable (the automatic marks stay). */
export function parseExaminer(raw: string | null, criteria: { key: string; title: string }[]): Examiner | null {
  if (!raw) return null;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
  const cj = (j.criteria ?? {}) as Record<string, { band?: unknown; notes?: unknown }>;
  const out: ExCriterion[] = [];
  for (const c of criteria) {
    const b = band(cj[c.key]?.band);
    if (b === null) return null; // every criterion must be marked
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
    // IELTS rounds the mean of the criteria to the nearest half band (x.25 -> x.5, x.75 -> next)
    band: Math.floor(mean * 2 + 0.5) / 2,
    criteria: out,
    summary: str(j.summary, 700),
    mistakes,
    rewrite: str(rw?.original) && str(rw?.improved) ? { original: str(rw!.original, 1500), improved: str(rw!.improved, 2000) } : undefined,
    next: (Array.isArray(j.next) ? j.next : []).map((n) => str(n, 300)).filter(Boolean).slice(0, 3),
  };
}

export const criteriaFor = { writing: WRITING_CRITERIA, speaking: SPEAKING_CRITERIA };
