import "server-only";
import { db } from "./db";
import { chat } from "./llm";
import { criteriaFor, parseExaminer, speakingMessages, writingMessages, type Examiner } from "./examiner";
import { getSpeaking, getWriting } from "./content/prompts";
import type { SpeechReport, TextReport } from "./analysis";

// Runs after a Writing or Speaking answer is stored: the examiner's marks replace the
// automatic band once they arrive (a few seconds later); the results page waits for them.

type Details = { text?: string; report?: TextReport | SpeechReport; parts?: { question: string; text: string; duration: number }[]; examiner?: Examiner; examinerState?: "pending" | "done" | "failed" };

export async function examineAttempt(id: string): Promise<void> {
  const a = await db.attempt.findUnique({ where: { id } });
  if (!a) return;
  const details = JSON.parse(a.details) as Details;
  if (details.examiner) return;
  let examiner: Examiner | null = null;
  if (a.section === "writing") {
    const prompt = getWriting(a.taskId);
    const report = details.report as TextReport | undefined;
    if (prompt && details.text) {
      const kind = prompt.task === "task2" ? "essay" : prompt.format === "general" ? "letter" : "report";
      const messages = writingMessages({
        task: prompt.task, kind, prompt: prompt.text, chart: prompt.chart, text: details.text, words: report?.words ?? 0,
        flagged: (report?.issues ?? []).map((i) => `${i.original} -> ${i.fix}`),
      });
      for (let i = 0; i < 2 && !examiner; i++) {
        examiner = parseExaminer(await chat(messages, { json: true, maxTokens: 2200, temperature: 0.2, timeoutMs: 60_000, purpose: "llm:writing" }), criteriaFor.writing(prompt.task));
      }
    }
  } else if (a.section === "speaking") {
    const task = getSpeaking(a.taskId);
    const report = details.report as SpeechReport | undefined;
    if (task && details.parts?.length) {
      const messages = speakingMessages({
        part: task.part, topic: task.topic,
        parts: details.parts.map((p) => ({ question: p.question, text: p.text, seconds: p.duration })),
        wpm: report?.wpm ?? 0, hesitations: report?.timing?.hesitations ?? null,
        fillers: (report?.fillers ?? []).reduce((s, f) => s + f.count, 0),
      });
      for (let i = 0; i < 2 && !examiner; i++) {
        examiner = parseExaminer(await chat(messages, { json: true, maxTokens: 1800, temperature: 0.2, timeoutMs: 60_000, purpose: "llm:speaking" }), criteriaFor.speaking);
      }
      // Pronunciation is the app's own measurement: it joins the examiner's three criteria
      const pr = report?.criteria.find((c) => c.key === "pr");
      if (examiner && pr) {
        examiner.criteria.push({ key: "pr", title: pr.title, band: pr.band, notes: pr.notes });
        const mean = examiner.criteria.reduce((s, c) => s + c.band, 0) / examiner.criteria.length;
        examiner.band = Math.floor(mean * 2 + 0.5) / 2;
      }
    }
  }
  const fresh = await db.attempt.findUnique({ where: { id } });
  const now = fresh ? (JSON.parse(fresh.details) as Details) : details;
  await db.attempt.update({
    where: { id },
    data: {
      details: JSON.stringify({ ...now, examiner: examiner ?? undefined, examinerState: examiner ? "done" : "failed" }),
      ...(examiner ? { band: examiner.band } : {}),
    },
  });
}
