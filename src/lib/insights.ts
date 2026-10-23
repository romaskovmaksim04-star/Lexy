// Numbers for the progress page and the home screen, computed from stored attempts.

import { roundBand } from "./band.ts";
import { SKILLS, type Skill } from "./profile.ts";

export type AttemptRow = { section: string; band: number; createdAt: Date; details: string; taskId: string };

export type Readiness = {
  kind: "done" | "on-track" | "tight" | "behind" | "no-date" | "no-data";
  weeksLeft: number | null;
  perWeekNeeded: number | null;
  realistic: number | null;
};

/** Mean of the last five attempts of each section. */
export function sectionBands(rows: AttemptRow[]): Record<Skill, { band: number | null; count: number; last: number | null }> {
  const out = {} as Record<Skill, { band: number | null; count: number; last: number | null }>;
  for (const s of SKILLS) {
    const list = rows.filter((r) => r.section === s).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const recent = list.slice(0, 5);
    out[s] = {
      band: recent.length ? roundBand(recent.reduce((a, r) => a + r.band, 0) / recent.length) : null,
      count: list.length,
      last: list[0]?.band ?? null,
    };
  }
  return out;
}

/** Overall estimate; with missing sections it averages the measured ones and says so. */
export function predicted(bands: Record<Skill, { band: number | null }>): { band: number | null; measured: number } {
  const vals = SKILLS.map((s) => bands[s].band).filter((b): b is number => b !== null);
  return { band: vals.length ? roundBand(vals.reduce((a, b) => a + b, 0) / vals.length) : null, measured: vals.length };
}

/** Whether the target is reachable by the exam date at the user's daily practice time. */
export function readiness(current: number | null, target: number, examDate: Date | null, dailyMinutes: number, now = new Date()): Readiness {
  if (current === null) return { kind: "no-data", weeksLeft: null, perWeekNeeded: null, realistic: null };
  if (current >= target) return { kind: "done", weeksLeft: null, perWeekNeeded: null, realistic: current };
  if (!examDate) return { kind: "no-date", weeksLeft: null, perWeekNeeded: null, realistic: null };
  const weeks = Math.max(0.5, (examDate.getTime() - now.getTime()) / (7 * 86_400_000));
  // Rough pace of steady practice: about half a band a month at 30 minutes a day, slower above Band 7
  const pace = 0.12 * Math.sqrt(Math.max(10, dailyMinutes) / 30) * (current >= 7 ? 0.6 : 1);
  const need = (target - current) / weeks;
  const realistic = Math.min(9, roundBand(current + pace * weeks));
  const kind = need <= pace * 0.8 ? "on-track" : need <= pace * 1.25 ? "tight" : "behind";
  return { kind, weeksLeft: Math.round(weeks), perWeekNeeded: Math.round(need * 100) / 100, realistic };
}

export type Trend = { section: Skill; points: { at: string; band: number }[] }[];

export function trends(rows: AttemptRow[], limit = 12): Trend {
  return SKILLS.map((s) => ({
    section: s,
    points: rows
      .filter((r) => r.section === s)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(-limit)
      .map((r) => ({ at: r.createdAt.toISOString(), band: r.band })),
  }));
}

/** Practice days in the last `weeks` weeks, for the activity grid. */
export function activity(dates: Date[], weeks = 12, now = new Date()): { day: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const d of dates) {
    const k = d.toISOString().slice(0, 10);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const days: { day: string; count: number }[] = [];
  const end = new Date(now.toISOString().slice(0, 10) + "T00:00:00.000Z");
  // Start on a Monday so columns are weeks
  const start = new Date(end.getTime() - (weeks * 7 - 1) * 86_400_000);
  const shift = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - shift);
  for (let t = start.getTime(); t <= end.getTime(); t += 86_400_000) {
    const k = new Date(t).toISOString().slice(0, 10);
    days.push({ day: k, count: counts.get(k) ?? 0 });
  }
  return days;
}

type Crit = { key: string; title: string; band: number };

/** Average band per criterion across writing (or speaking) reports. */
export function criteriaAverages(rows: AttemptRow[], section: "writing" | "speaking"): { title: string; band: number }[] {
  const sum = new Map<string, { title: string; total: number; n: number }>();
  for (const r of rows.filter((x) => x.section === section)) {
    let crit: Crit[] = [];
    try { crit = JSON.parse(r.details).report?.criteria ?? []; } catch { continue; }
    for (const c of crit) {
      const cur = sum.get(c.key) ?? { title: c.title, total: 0, n: 0 };
      cur.total += c.band;
      cur.n += 1;
      sum.set(c.key, cur);
    }
  }
  return [...sum.values()].map((v) => ({ title: v.title, band: roundBand(v.total / v.n) }));
}

/** Most frequent mistakes across essays and speaking answers. */
export function topMistakes(rows: AttemptRow[], limit = 6): { rule: string; count: number; example: string; fix: string; why: string }[] {
  const map = new Map<string, { rule: string; count: number; example: string; fix: string; why: string }>();
  for (const r of rows) {
    if (r.section !== "writing" && r.section !== "speaking") continue;
    let issues: { rule: string; original: string; fix: string; why: string; kind: string }[] = [];
    try { issues = JSON.parse(r.details).report?.issues ?? []; } catch { continue; }
    for (const i of issues) {
      if (i.kind === "style") continue;
      const cur = map.get(i.rule) ?? { rule: i.rule, count: 0, example: i.original, fix: i.fix, why: i.why };
      cur.count += 1;
      map.set(i.rule, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export function speakingAverages(rows: AttemptRow[]): { wpm: number; fillers: number; hesitations: number; tests: number } | null {
  const list = rows.filter((r) => r.section === "speaking");
  if (!list.length) return null;
  let wpm = 0, fillers = 0, hes = 0, n = 0;
  for (const r of list) {
    try {
      const rep = JSON.parse(r.details).report;
      wpm += rep.wpm ?? 0;
      fillers += (rep.fillers ?? []).reduce((a: number, f: { count: number }) => a + f.count, 0);
      hes += rep.timing?.hesitations ?? 0;
      n += 1;
    } catch { /* skip broken row */ }
  }
  return n ? { wpm: Math.round(wpm / n), fillers: Math.round((fillers / n) * 10) / 10, hesitations: Math.round((hes / n) * 10) / 10, tests: n } : null;
}
