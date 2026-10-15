// Onboarding answers, their Russian labels, and the daily plan built from them.

export const SKILLS = ["listening", "reading", "writing", "speaking"] as const;
export type Skill = (typeof SKILLS)[number];

export const SKILL_RU: Record<Skill, string> = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
};

export const SKILL_HINT: Record<Skill, string> = {
  listening: "Аудио с ловушками, как на экзамене",
  reading: "Тексты, True / False / Not Given",
  writing: "Эссе с разбором по 4 критериям",
  speaking: "Отвечаешь голосом, получаешь разбор",
};

export const BANDS = [5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];

export const WINDOWS = [
  { value: "1m", label: "В ближайший месяц", days: 30 },
  { value: "1-3m", label: "Через 1-3 месяца", days: 75 },
  { value: "3-6m", label: "Через 3-6 месяцев", days: 150 },
  { value: "no-date", label: "Пока не знаю", days: 0 },
] as const;

export const EXPERIENCE = [
  { value: "yes", label: "Да, первый раз" },
  { value: "mock", label: "Сдавал(а) пробный" },
  { value: "real", label: "Уже сдавал(а) настоящий" },
] as const;

export const MINUTES = [
  { value: 15, label: "15 минут" },
  { value: 30, label: "30 минут" },
  { value: 60, label: "1 час" },
  { value: 120, label: "2 часа и больше" },
] as const;

export const WORRIES = [
  { value: "fail", label: "Не набрать нужный балл" },
  { value: "money", label: "Потратить деньги на пересдачу" },
  { value: "time", label: "Не успеть подготовиться" },
  { value: "confidence", label: "Растеряться на Speaking" },
] as const;

export type PlanTask = {
  id: string;
  section: Skill | "words";
  title: string;
  detail: string;
  minutes: number;
  href: string;
};

const BY_SKILL: Record<Skill, Omit<PlanTask, "id" | "minutes">[]> = {
  listening: [
    { section: "listening", title: "Listening, Part 1", detail: "Анкета на слух: цифры, имена, ловушки", href: "/app/listening/sports-centre" },
  ],
  reading: [
    { section: "reading", title: "Reading: Why we forget", detail: "13 вопросов, Academic", href: "/app/reading/forgetting" },
    { section: "reading", title: "Reading: объявление", detail: "10 вопросов, General Training", href: "/app/reading/coworking" },
  ],
  writing: [
    { section: "writing", title: "Writing Task 2", detail: "Эссе на 250 слов за 40 минут", href: "/app/writing/w-uni-free" },
    { section: "writing", title: "Writing Task 2", detail: "Работа из дома: плюсы и минусы", href: "/app/writing/w-remote" },
    { section: "writing", title: "Writing Task 2", detail: "Цены на жильё: проблема и решение", href: "/app/writing/w-cities" },
  ],
  speaking: [
    { section: "speaking", title: "Speaking, Part 1", detail: "4 вопроса про дом", href: "/app/speaking/s1-home" },
    { section: "speaking", title: "Speaking, Part 2", detail: "Карточка: навык, которым гордишься", href: "/app/speaking/s2-skill" },
    { section: "speaking", title: "Speaking, Part 3", detail: "Обсуждение: образование", href: "/app/speaking/s3-education" },
    { section: "speaking", title: "Speaking, Part 1", detail: "4 вопроса про музыку", href: "/app/speaking/s1-music" },
  ],
};

/** Day number used to rotate tasks, so the plan changes every day. */
export function dayIndex(date = new Date()): number {
  return Math.floor(date.getTime() / 86_400_000);
}

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function dailyPlan(focus: Skill, minutes: number, date = new Date()): PlanTask[] {
  const day = dayIndex(date);
  const others = SKILLS.filter((s) => s !== focus);
  const second = others[day % others.length];
  const pick = (skill: Skill, shift = 0) => BY_SKILL[skill][(day + shift) % BY_SKILL[skill].length];

  const plan: PlanTask[] = [
    { id: "words", section: "words", title: "Повтори слова", detail: "Карточки на сегодня", href: "/app/words", minutes: 5 },
    { id: "focus", ...pick(focus), minutes: focus === "writing" ? 40 : 15 },
  ];
  if (minutes >= 30) plan.push({ id: "second", ...pick(second, 1), minutes: second === "writing" ? 40 : 15 });
  if (minutes >= 60) {
    const third = others.find((s) => s !== second)!;
    plan.push({ id: "third", ...pick(third, 2), minutes: third === "writing" ? 40 : 15 });
  }
  if (minutes >= 120) plan.push({ id: "extra", ...pick(focus, 1), minutes: focus === "writing" ? 40 : 15 });
  return plan;
}

export function daysUntilExam(window: string, createdAt: Date, now = new Date()): number | null {
  const w = WINDOWS.find((x) => x.value === window);
  if (!w || !w.days) return null;
  const left = w.days - Math.floor((now.getTime() - createdAt.getTime()) / 86_400_000);
  return Math.max(0, left);
}

/** Streak after practising today, given the last practice day. */
export function nextStreak(streak: number, lastActive: string | null, now = new Date()): number {
  const today = todayKey(now);
  if (lastActive === today) return Math.max(streak, 1);
  const yesterday = todayKey(new Date(now.getTime() - 86_400_000));
  return lastActive === yesterday ? streak + 1 : 1;
}

/** Streak as shown: it lapses if neither today nor yesterday had practice. */
export function liveStreak(streak: number, lastActive: string | null, now = new Date()): number {
  if (!lastActive) return 0;
  const yesterday = todayKey(new Date(now.getTime() - 86_400_000));
  return lastActive === todayKey(now) || lastActive === yesterday ? streak : 0;
}
