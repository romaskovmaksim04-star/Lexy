import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenText, CheckCircle, Headphones, Microphone, PencilLine, Shuffle } from "@phosphor-icons/react/dist/ssr";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { catalogFor } from "@/lib/catalog";
import { SKILLS, type Skill } from "@/lib/profile";
import { formatBand } from "@/lib/band";

export const metadata: Metadata = { title: "Тесты" };

const TABS: Record<Skill, { label: string; icon: typeof Headphones; about: string }> = {
  listening: { label: "Listening", icon: Headphones, about: "Аудио звучит как на экзамене. Можно включить режим с паузой и перемоткой." },
  reading: { label: "Reading", icon: BookOpenText, about: "Выделяй текст и сохраняй слова в карточки прямо во время теста." },
  writing: { label: "Writing", icon: PencilLine, about: "Оценка по четырём критериям, исправления и модельный ответ." },
  speaking: { label: "Speaking", icon: Microphone, about: "Экзаменатор задаёт вопросы голосом, ты отвечаешь в микрофон." },
};

export default async function Tests({ searchParams }: { searchParams: Promise<{ skill?: string }> }) {
  const user = (await currentUser())!;
  const { skill: raw } = await searchParams;
  const skill: Skill = SKILLS.includes(raw as Skill) ? (raw as Skill) : (user.focusSkill as Skill);
  const items = catalogFor(skill, user.format as "academic" | "general");
  const attempts = await db.attempt.findMany({
    where: { userId: user.id, section: skill },
    orderBy: { createdAt: "desc" },
    select: { taskId: true, band: true, id: true },
  });
  const best = new Map<string, { band: number; count: number; last: string }>();
  for (const a of attempts) {
    const b = best.get(a.taskId);
    if (!b) best.set(a.taskId, { band: a.band, count: 1, last: a.id });
    else best.set(a.taskId, { band: Math.max(b.band, a.band), count: b.count + 1, last: b.last });
  }
  // Untried first, then the ones done longest ago
  const sorted = [...items].sort((a, b) => Number(best.has(a.id)) - Number(best.has(b.id)));
  const random = sorted.find((i) => !best.has(i.id)) ?? sorted[Math.floor((Date.now() / 86_400_000) % sorted.length)];
  const Tab = TABS[skill];

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="display text-3xl font-bold md:text-4xl">Пробные тесты IELTS</h1>
        <p className="mt-2 text-muted">Выбери секцию. Сначала идут задания, которые ты ещё не проходил(а).</p>
      </div>

      <nav aria-label="Секции" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {SKILLS.map((s) => {
          const T = TABS[s];
          const on = s === skill;
          return (
            <Link key={s} href={`/app/tests?skill=${s}`} aria-current={on ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition ${on ? "border-ink bg-ink text-bg" : "border-line bg-surface text-muted hover:text-ink"}`}>
              <T.icon size={18} weight={on ? "fill" : "regular"} /> {T.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-surface-2 p-5">
        <p className="max-w-[52ch] text-[15px] text-muted"><Tab.icon size={18} className="mr-1.5 inline text-fire-text" weight="fill" />{Tab.about}</p>
        {random && <Link href={random.href} className="btn btn-ink btn-sm"><Shuffle size={16} weight="bold" /> Случайный тест</Link>}
      </div>

      {sorted.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {sorted.map((item) => {
            const b = best.get(item.id);
            return (
              <li key={item.id}>
                <Link href={item.href} className="card flex h-full items-center gap-4 p-5 transition hover:-translate-y-0.5">
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{item.title}</span>
                    <span className="mt-0.5 block text-sm text-muted">{item.detail}</span>
                    <span className="mt-3 inline-flex flex-wrap gap-2">
                      <span className="chip">{item.minutes} мин</span>
                      <span className="chip">{item.tag}</span>
                      {b && <span className="chip border-ok/30 bg-ok-soft text-ok"><CheckCircle size={14} weight="fill" /> {formatBand(b.band)} · попыток: {b.count}</span>}
                    </span>
                  </span>
                  <ArrowRight size={20} className="shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-muted">Здесь пока нет тестов для твоего формата.</p>
      )}
    </div>
  );
}
