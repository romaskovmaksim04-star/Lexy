// The daily plan: what to do today, built from the catalog, the user's focus and time,
// what they have already tried and what is due for review.

import { CATALOG, type CatalogItem } from "./catalog.ts";
import { SKILLS, type Skill } from "./profile.ts";

export type PlanTask = {
  id: string;
  kind: Skill | "words" | "preppy";
  title: string;
  detail: string;
  minutes: number;
  href: string;
  done: boolean;
  diagnostic?: boolean;
};

export type PlanInput = {
  focus: Skill;
  minutes: number;
  format: "academic" | "general";
  measured: Set<Skill>; // sections with at least one attempt
  tried: Set<string>; // task ids ever attempted
  doneToday: Set<string>; // task ids attempted today
  dueWords: number;
  talkedToday: boolean;
  date?: Date;
};

const SECTION_RU: Record<Skill, string> = { listening: "Listening", reading: "Reading", writing: "Writing", speaking: "Speaking" };

function dayIndex(date: Date) {
  return Math.floor(date.getTime() / 86_400_000);
}

function pickTask(section: Skill, input: PlanInput, salt: number, exclude: Set<string>): CatalogItem | undefined {
  const pool = CATALOG.filter((c) => c.section === section && (c.format === "both" || c.format === input.format) && !exclude.has(c.id));
  if (!pool.length) return undefined;
  // Done today stays in the plan (shown as done); otherwise untried first, rotating by day
  const today = pool.find((c) => input.doneToday.has(c.id));
  if (today) return today;
  const fresh = pool.filter((c) => !input.tried.has(c.id));
  const list = fresh.length ? fresh : pool;
  return list[(dayIndex(input.date ?? new Date()) + salt) % list.length];
}

function asTask(item: CatalogItem, input: PlanInput, diagnostic = false): PlanTask {
  return {
    id: item.id,
    kind: item.section,
    title: diagnostic ? `Замер: ${SECTION_RU[item.section]}` : item.title,
    detail: diagnostic ? `${item.title} · откроет твой балл по секции` : item.detail,
    minutes: item.minutes,
    href: item.href,
    done: input.doneToday.has(item.id),
    diagnostic,
  };
}

export function buildPlan(input: PlanInput): PlanTask[] {
  const plan: PlanTask[] = [];
  const used = new Set<string>();
  let budget = input.minutes;

  if (input.dueWords > 0) {
    plan.push({ id: "words", kind: "words", title: "Повтори слова", detail: `${input.dueWords} карточек на сегодня`, minutes: 5, href: "/app/words", done: false });
    budget -= 5;
  }

  // Until every section is measured, the plan is the level check, focus section first
  const unmeasured = [input.focus, ...SKILLS.filter((s) => s !== input.focus)].filter((s) => !input.measured.has(s));
  if (unmeasured.length) {
    unmeasured.forEach((s, i) => {
      const item = pickTask(s, input, i, used);
      if (!item || (i > 0 && budget < item.minutes / 2)) return;
      used.add(item.id);
      plan.push(asTask(item, input, true));
      budget -= item.minutes;
    });
    return plan;
  }

  const day = dayIndex(input.date ?? new Date());
  const others = SKILLS.filter((s) => s !== input.focus);
  const order: Skill[] = [input.focus, others[day % 3], input.focus, others[(day + 1) % 3], others[(day + 2) % 3]];
  for (let i = 0; i < order.length; i++) {
    const item = pickTask(order[i], input, i, used);
    if (!item) continue;
    if (i > 0 && budget < Math.min(item.minutes, 15)) break;
    used.add(item.id);
    plan.push(asTask(item, input));
    budget -= item.minutes;
  }

  if (input.minutes >= 30) {
    plan.push({ id: "preppy", kind: "preppy", title: "Позвони Lexi", detail: "Пара минут живого разговора на любую тему", minutes: 5, href: "/app/lexi", done: input.talkedToday });
  }
  return plan;
}
