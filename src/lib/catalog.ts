// One list of every practice task, for the tests page, the daily plan and stats.

import { READING } from "./content/reading.ts";
import { LISTENING } from "./content/listening.ts";
import { SPEAKING, WRITING } from "./content/prompts.ts";
import { allQuestions } from "./content/types.ts";
import type { Skill } from "./profile.ts";

export type CatalogItem = {
  id: string;
  section: Skill;
  title: string;
  detail: string;
  minutes: number;
  href: string;
  format: "academic" | "general" | "both";
  tag: string; // question/essay type for filters
};

const PART_RU = { 1: "Part 1: интервью", 2: "Part 2: карточка", 3: "Part 3: дискуссия" } as const;

export const CATALOG: CatalogItem[] = [
  ...READING.map((r) => ({
    id: r.id, section: "reading" as const, title: r.title,
    detail: `${allQuestions(r.groups).length} вопр. · ${r.format === "academic" ? "Academic" : "General Training"}`,
    minutes: r.minutes, href: `/app/reading/${r.id}`, format: r.format, tag: r.topic,
  })),
  ...LISTENING.map((l) => ({
    id: l.id, section: "listening" as const, title: l.title,
    detail: `Part ${l.part} · ${allQuestions(l.groups).length} вопр.`,
    minutes: 10, href: `/app/listening/${l.id}`, format: "both" as const, tag: `Part ${l.part}`,
  })),
  ...WRITING.map((w) => ({
    id: w.id, section: "writing" as const, title: `${w.task === "task1" ? "Task 1" : "Task 2"}: ${w.type}`,
    detail: w.text.split("\n")[0].slice(0, 90) + (w.text.split("\n")[0].length > 90 ? "…" : ""),
    minutes: w.minutes, href: `/app/writing/${w.id}`, format: w.format, tag: w.type,
  })),
  ...SPEAKING.map((s) => ({
    id: s.id, section: "speaking" as const, title: `${PART_RU[s.part]} · ${s.topic}`,
    detail: s.part === 2 ? s.questions[0].split("\n")[0] : `${s.questions.length} вопроса`,
    minutes: s.part === 2 ? 4 : s.part === 1 ? 4 : 5, href: `/app/speaking/${s.id}`, format: "both" as const, tag: `Part ${s.part}`,
  })),
];

export function catalogFor(section: Skill, format?: "academic" | "general"): CatalogItem[] {
  return CATALOG.filter((c) => c.section === section && (!format || c.format === "both" || c.format === format));
}

export function catalogItem(id: string): CatalogItem | undefined {
  return CATALOG.find((c) => c.id === id);
}
