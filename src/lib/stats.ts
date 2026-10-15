import { db } from "./db";
import { overallBand, roundBand } from "./band";
import { SKILLS, todayKey, type Skill } from "./profile";

export type SectionStat = { section: Skill; band: number | null; count: number };

/** Current estimate per section: mean of the last five attempts. */
export async function sectionStats(userId: string): Promise<{ sections: SectionStat[]; overall: number | null }> {
  const attempts = await db.attempt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { section: true, band: true },
    take: 200,
  });
  const sections = SKILLS.map((section) => {
    const list = attempts.filter((a) => a.section === section);
    const recent = list.slice(0, 5);
    const band = recent.length ? roundBand(recent.reduce((a, b) => a + b.band, 0) / recent.length) : null;
    return { section, band, count: list.length };
  });
  const all = sections.map((s) => s.band);
  const overall = all.every((b) => b !== null) ? overallBand(all as [number, number, number, number]) : null;
  return { sections, overall };
}

/** Task ids finished today, to tick off plan items. */
export async function doneToday(userId: string): Promise<Set<string>> {
  const start = new Date(`${todayKey()}T00:00:00.000Z`);
  const rows = await db.attempt.findMany({ where: { userId, createdAt: { gte: start } }, select: { taskId: true } });
  return new Set(rows.map((r) => r.taskId));
}

export async function dueWordCount(userId: string): Promise<number> {
  return db.card.count({ where: { userId, due: { lte: new Date() } } });
}
