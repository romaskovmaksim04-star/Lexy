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

/** Day number used to rotate tasks, so the plan changes every day. */
export function dayIndex(date = new Date()): number {
  return Math.floor(date.getTime() / 86_400_000);
}

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
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
