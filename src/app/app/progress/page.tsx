import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Flame, Warning } from "@phosphor-icons/react/dist/ssr";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatBand } from "@/lib/band";
import { SKILLS, SKILL_RU, liveStreak, type Skill } from "@/lib/profile";
import { activity, criteriaAverages, predicted, readiness, sectionBands, speakingAverages, topMistakes, trends } from "@/lib/insights";
import { ActivityGrid, TrendChart } from "@/components/app/TrendChart";
import { premiumGate } from "@/components/app/PremiumWall";

export const metadata: Metadata = { title: "Прогресс" };

const READY_TEXT = {
  done: { title: "Цель уже в кармане", text: "Текущий уровень выше цели. Держи планку и проверь себя полным пробником." },
  "on-track": { title: "Успеваешь, держи темп", text: "При твоём времени на занятия цель реальна к дате экзамена." },
  tight: { title: "Впритык: без пропусков", text: "Цель достижима, если заниматься каждый день по плану." },
  behind: { title: "В этом темпе не успеть", text: "Добавь времени на занятия или сдвинь дату. Честно лучше, чем пересдача." },
  "no-date": { title: "Поставь дату экзамена", text: "С датой станет видно, успеваешь ли ты к цели." },
  "no-data": { title: "Пройди первые тесты", text: "После первых тестов появится прогноз балла к экзамену." },
} as const;

export default async function Progress() {
  const wall = await premiumGate("progress");
  if (wall) return wall;
  const user = (await currentUser())!;
  const [rows, convs, cards] = await Promise.all([
    db.attempt.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 400, select: { section: true, band: true, createdAt: true, details: true, taskId: true } }),
    db.conversation.findMany({ where: { userId: user.id, endedAt: { not: null } }, select: { createdAt: true, seconds: true } }),
    db.card.findMany({ where: { userId: user.id }, select: { reps: true, lapses: true, due: true } }),
  ]);
  const bands = sectionBands(rows);
  const pred = predicted(bands);
  const ready = readiness(pred.band, user.targetBand, user.examDate, user.dailyMinutes);
  const trend = trends(rows);
  const days = activity([...rows.map((r) => r.createdAt), ...convs.map((c) => c.createdAt)]);
  const writing = criteriaAverages(rows, "writing");
  const mistakes = topMistakes(rows);
  const speaking = speakingAverages(rows);
  const weakest = SKILLS.filter((s) => bands[s].band !== null).sort((a, b) => (bands[a].band ?? 0) - (bands[b].band ?? 0))[0] as Skill | undefined;
  const preppyMinutes = Math.round(convs.reduce((a, c) => a + c.seconds, 0) / 60);
  const learned = cards.filter((c) => c.reps >= 2).length;
  const retention = cards.length ? Math.round((cards.filter((c) => c.lapses === 0).length / cards.length) * 100) : null;
  const daysLeft = user.examDate ? Math.max(0, Math.ceil((user.examDate.getTime() - Date.now()) / 86_400_000)) : null;
  const r = READY_TEXT[ready.kind];

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="display text-3xl font-bold md:text-4xl">Прогресс</h1>
        <p className="mt-2 text-muted">Всё собрано из твоих реальных результатов.</p>
      </div>

      <section className="grid gap-3 md:grid-cols-[1.2fr_1fr]">
        <div className="card p-6">
          <p className="text-sm font-bold text-muted">Прогноз IELTS</p>
          <div className="mt-2 flex items-end gap-4">
            <p className="display text-6xl font-extrabold leading-none">{pred.band !== null ? formatBand(pred.band) : "—"}</p>
            <p className="pb-1 text-muted">→ цель <span className="font-bold text-ink">{formatBand(user.targetBand)}</span></p>
          </div>
          {pred.measured > 0 && pred.measured < 4 && <p className="mt-3 text-sm text-muted">Измерено секций: {pred.measured} из 4. Пройди остальные, и прогноз станет точнее.</p>}
          <div className="mt-5 rounded-2xl bg-surface-2 p-4">
            <p className="font-bold">{r.title}</p>
            <p className="mt-1 text-sm text-muted">{r.text}</p>
            {ready.weeksLeft !== null && ready.realistic !== null && (
              <p className="mt-2 text-sm">Осталось ~{ready.weeksLeft} нед. К дате реалистично ~<span className="font-bold">{formatBand(ready.realistic)}</span>.</p>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/app/profile#exam" className="btn btn-ghost btn-sm">{daysLeft !== null ? `До экзамена ${daysLeft} дн.` : "Выбрать дату"}</Link>
            {weakest && <Link href={`/app/tests?skill=${weakest}`} className="btn btn-ink btn-sm">Практиковать {SKILL_RU[weakest]} <ArrowRight size={14} /></Link>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {SKILLS.map((s) => (
            <Link key={s} href={`/app/tests?skill=${s}`} className="card p-5 transition hover:-translate-y-0.5">
              <p className="text-sm font-bold text-muted">{SKILL_RU[s]}</p>
              <p className="display mt-1 text-3xl font-extrabold">{bands[s].band !== null ? formatBand(bands[s].band!) : "—"}</p>
              <p className="mt-1 text-xs text-muted">{bands[s].count ? `тестов: ${bands[s].count}` : "ещё не практиковали"}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-bold">Динамика баллов</h2>
        <div className="mt-4"><TrendChart target={user.targetBand} series={trend.map((t) => ({ section: t.section, label: SKILL_RU[t.section], points: t.points }))} /></div>
      </section>

      <section className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
        <div className="card p-6">
          <h2 className="font-bold">Активность</h2>
          <p className="mt-1 text-sm text-muted">Тесты и разговоры с Lexi за последние 12 недель.</p>
          <div className="mt-4"><ActivityGrid days={days} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-fire p-5 text-[#1b1433]"><p className="text-sm font-bold">Серия</p><p className="display mt-1 flex items-center gap-1 text-3xl font-extrabold"><Flame size={26} weight="fill" />{liveStreak(user.streak, user.lastActive)}</p><p className="text-xs font-semibold">дней подряд</p></div>
          <div className="card p-5"><p className="text-sm text-muted">Время с Lexi</p><p className="display mt-1 text-3xl font-extrabold">{preppyMinutes}</p><p className="text-xs text-muted">минут</p></div>
          <div className="card p-5"><p className="text-sm text-muted">Слов выучено</p><p className="display mt-1 text-3xl font-extrabold">{learned}</p><p className="text-xs text-muted">из {cards.length} карточек</p></div>
          <div className="card p-5"><p className="text-sm text-muted">Запоминание</p><p className="display mt-1 text-3xl font-extrabold">{retention !== null ? `${retention}%` : "—"}</p><p className="text-xs text-muted">карточек без забываний</p></div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-bold">Writing по критериям</h2>
          {writing.length ? (
            <ul className="mt-4 grid gap-3">
              {writing.map((c) => (
                <li key={c.title} className="flex items-center justify-between gap-3">
                  <span className="text-[15px]">{c.title}</span>
                  <span className={`display text-xl font-extrabold ${c.band >= user.targetBand ? "text-ok" : ""}`}>{formatBand(c.band)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-sm text-muted">Пройди тест по письму, чтобы увидеть статистику.</p>}
        </section>
        <section className="card p-6">
          <h2 className="font-bold">Speaking в цифрах</h2>
          {speaking ? (
            <dl className="mt-4 grid grid-cols-3 gap-3">
              <div><dt className="text-xs text-muted">Средний темп</dt><dd className="display text-2xl font-extrabold">{speaking.wpm}</dd><dd className="text-xs text-muted">норма 120-150</dd></div>
              <div><dt className="text-xs text-muted">Паразиты</dt><dd className="display text-2xl font-extrabold">{speaking.fillers}</dd><dd className="text-xs text-muted">за тест</dd></div>
              <div><dt className="text-xs text-muted">Колебания</dt><dd className="display text-2xl font-extrabold">{speaking.hesitations}</dd><dd className="text-xs text-muted">за тест</dd></div>
            </dl>
          ) : <p className="mt-3 text-sm text-muted">Пройди тест по говорению, чтобы увидеть статистику.</p>}
        </section>
      </div>

      <section className="card p-6">
        <h2 className="flex items-center gap-2 font-bold"><Warning size={20} weight="fill" className="text-fire-text" /> Типичные ошибки</h2>
        {mistakes.length ? (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {mistakes.map((m) => (
              <li key={m.rule} className="rounded-2xl bg-surface-2 p-4">
                <p className="flex items-baseline justify-between gap-3 text-[15px]">
                  <span><span className="text-bad line-through">{m.example}</span> → <span className="font-bold text-ok">{m.fix}</span></span>
                  <span className="chip shrink-0">×{m.count}</span>
                </p>
                <p className="mt-1 text-sm text-muted">{m.why}</p>
              </li>
            ))}
          </ul>
        ) : <p className="mt-3 text-sm text-muted">Нет данных об ошибках. Они появятся после Writing и Speaking.</p>}
      </section>
    </div>
  );
}
