// Plans and prices (Maks's pricing: Free / Pro / Pro+). A purchase is one paid month,
// without automatic renewals: Platega takes one-off payments.

export type PlanKey = "free" | "pro" | "proplus";

export type Plan = {
  key: PlanKey;
  name: string;
  price: number; // roubles per month
  pitch: string;
  features: string[];
  popular?: boolean;
};

export const PLANS: Plan[] = [
  {
    key: "free",
    name: "Free",
    price: 0,
    pitch: "Всё, чтобы начать и понять, как это работает.",
    features: ["Все тренажёры четырёх секций и игры", "3 проверки Speaking и 2 эссе в день", "3 минуты звонка с Lexi в день", "Словарь, план и статистика"],
  },
  {
    key: "pro",
    name: "Pro",
    price: 1490,
    pitch: "Если готовишься к IELTS в ближайшие месяцы.",
    popular: true,
    features: ["Lexi до 30 минут живого разговора в день, все характеры и голоса", "40 проверок Speaking и 15 эссе в день", "Разбор каждого разговора по критериям IELTS", "Подробная статистика и типичные ошибки"],
  },
  {
    key: "proplus",
    name: "Pro+",
    price: 3990,
    pitch: "Максимум, если цель 7.5+ и нужен интенсив.",
    features: ["Всё, что в Pro", "Lexi до 60 минут в день, 80 проверок Speaking и 30 эссе", "Персональный куратор раз в неделю", "Проверка Writing человеком-экспертом", "Гарантия результата"],
  },
];

export function plan(key: string): Plan | undefined {
  return PLANS.find((p) => p.key === key);
}

/** Price after the quiz-wheel discount, rounded to whole roubles. */
export function discounted(price: number, percent: number): number {
  return Math.round(price * (1 - Math.max(0, Math.min(60, percent)) / 100));
}
