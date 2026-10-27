import Link from "next/link";
import { GameController, Lock, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { currentUser } from "@/lib/auth";
import { isPremium } from "@/lib/access";

// Without Premium only the games and the profile are open (Maks, 2026-10-25). Every other
// cabinet page returns this wall instead of its content, so nothing of it reaches the browser.

export type Locked = "tests" | "course" | "lexi" | "words" | "progress" | "home";

const TEXT: Record<Locked, { title: string; text: string }> = {
  tests: { title: "Пробные тесты IELTS", text: "Reading, Listening, Writing и Speaking в формате экзамена: проверка, разбор ошибок и прогноз балла." },
  lexi: { title: "Lexi — живой репетитор", text: "Разговор вслух с ИИ: Lexi исправляет ошибки, подсказывает произношение и пишет разбор после звонка." },
  words: { title: "Словарь", text: "Карточки с интервальным повторением: слова из твоих тестов возвращаются, когда начинаешь их забывать." },
  progress: { title: "Статистика", text: "Прогноз балла, слабые места и динамика по каждой секции." },
  course: { title: "Курс английского A1–C1", text: "150 уроков: грамматика, слова, чтение и аудирование, тест в конце каждого уровня." },
  home: { title: "Твой план до экзамена", text: "Прогноз балла, план на каждый день и разговоры с Lexi." },
};

/** The wall for a page, or null when the user has Premium. */
export async function premiumGate(section: Locked) {
  const user = await currentUser();
  return user && isPremium(user) ? null : <PremiumWall section={section} />;
}

export function PremiumCard({ section }: { section: Locked }) {
  const t = TEXT[section];
  return (
    <div className="card relative mx-auto max-w-md p-6 text-center shadow-xl md:p-8">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-fire-soft text-fire-text"><Lock size={28} weight="fill" /></span>
      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-fire-text">Доступно в Premium</p>
      <h1 className="display mt-1 text-2xl font-bold">{t.title}</h1>
      <p className="mt-2 text-muted">{t.text}</p>
      <Link href="/pricing" className="btn btn-fire mt-6 w-full justify-center"><Sparkle size={18} weight="fill" /> Оформить Premium</Link>
      <Link href="/app/games" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-ink"><GameController size={18} /> Пока поиграть в игры — бесплатно</Link>
    </div>
  );
}

export function PremiumWall({ section }: { section: Locked }) {
  // A blurred stand-in behind the card, so the page looks like it is there but closed
  return (
    <div className="relative min-h-[70dvh]">
      <div aria-hidden className="pointer-events-none grid select-none gap-4 opacity-60 blur-[6px]">
        <div className="h-10 w-2/3 rounded-2xl bg-surface-2" />
        <div className="h-40 rounded-[2rem] bg-surface-2" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-28 rounded-3xl bg-surface-2" />)}
        </div>
      </div>
      <div className="absolute inset-0 flex items-start justify-center pt-10 md:pt-16">
        <PremiumCard section={section} />
      </div>
    </div>
  );
}
