import Link from "next/link";
import { ArrowRight, BookOpenText, CalendarBlank, CardsThree, ChatsCircle, CheckCircle, Flame, Headphones, Microphone, PencilLine } from "@phosphor-icons/react/dist/ssr";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatBand } from "@/lib/band";
import { liveStreak, todayKey, SKILL_RU, type Skill } from "@/lib/profile";
import { buildPlan, type PlanTask } from "@/lib/plan";
import { predicted, sectionBands } from "@/lib/insights";
import { catalogItem } from "@/lib/catalog";
import { Mascot } from "@/components/ui/Mascot";
import { GameTiles } from "@/components/games/GameCards";
import { PremiumCard } from "@/components/app/PremiumWall";
import { isPremium } from "@/lib/access";

const ICON: Record<PlanTask["kind"], typeof Headphones> = {
  listening: Headphones, reading: BookOpenText, writing: PencilLine, speaking: Microphone, words: CardsThree, preppy: ChatsCircle,
};

function Gauge({ value, target }: { value: number | null; target: number }) {
  // Arc from Band 3 to 9; the dashed tick marks the target
  const R = 54;
  const len = Math.PI * R;
  const frac = (b: number) => Math.max(0, Math.min(1, (b - 3) / 6));
  const t = frac(target);
  const tx = 70 - R * Math.cos(Math.PI * t);
  const ty = 66 - R * Math.sin(Math.PI * t);
  return (
    <svg viewBox="0 0 140 80" className="w-44" aria-hidden>
      <path d="M16 66a54 54 0 0 1 108 0" fill="none" stroke="rgb(255 255 255 / 0.14)" strokeWidth="10" strokeLinecap="round" />
      {value !== null && (
        <path d="M16 66a54 54 0 0 1 108 0" fill="none" stroke="var(--fire)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${len * frac(value)} ${len}`} />
      )}
      <circle cx={tx} cy={ty} r="5" fill="var(--bg)" stroke="var(--fire-2)" strokeWidth="2.5" />
    </svg>
  );
}

export default async function Today({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = (await currentUser())!;
  const { welcome } = await searchParams;
  const start = new Date(`${todayKey()}T00:00:00.000Z`);
  const [rows, dueWords, talkedToday, recent] = await Promise.all([
    db.attempt.findMany({ where: { userId: user.id }, select: { section: true, band: true, createdAt: true, details: true, taskId: true } }),
    db.card.count({ where: { userId: user.id, due: { lte: new Date() } } }),
    db.conversation.count({ where: { userId: user.id, createdAt: { gte: start } } }),
    db.attempt.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 3, select: { id: true, section: true, band: true, taskId: true, createdAt: true } }),
  ]);
  const bands = sectionBands(rows);
  const pred = predicted(bands);
  const measured = new Set(rows.map((r) => r.section as Skill));
  const plan = buildPlan({
    focus: user.focusSkill as Skill,
    minutes: user.dailyMinutes,
    format: user.format as "academic" | "general",
    measured,
    tried: new Set(rows.map((r) => r.taskId)),
    doneToday: new Set(rows.filter((r) => r.createdAt >= start).map((r) => r.taskId)),
    dueWords,
    talkedToday: talkedToday > 0,
  });
  const done = plan.filter((t) => t.done).length;
  const next = plan.find((t) => !t.done);
  const daysLeft = user.examDate ? Math.max(0, Math.ceil((user.examDate.getTime() - Date.now()) / 86_400_000)) : null;
  const streak = liveStreak(user.streak, user.lastActive);
  const diagnostic = plan.some((t) => t.diagnostic);
  const gap = pred.band !== null ? Math.max(0, user.targetBand - pred.band) : null;

  const body = (
    <div className="grid gap-6">
      {welcome && (
        <div className="relative overflow-hidden rounded-[2rem] bg-fire p-6 text-[#1b1433] md:p-8">
          <Mascot animated className="bob absolute -bottom-4 right-4 hidden w-28 md:block" />
          <p className="display text-2xl font-bold">{user.name}, твой план до IELTS {formatBand(user.targetBand)} готов!</p>
          <p className="mt-2 max-w-[52ch] font-medium">Начни с замера уровня: короткие задания по секциям покажут твой стартовый балл, и план станет персональным.</p>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-3xl font-bold md:text-4xl">{welcome ? "Привет" : "С возвращением"}, {user.name}!</h1>
          <p className="mt-1 text-muted">{done === plan.length && plan.length ? "Всё на сегодня выполнено!" : next ? `Дальше: ${next.title}` : ""}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-fire-soft px-4 py-2 font-bold text-fire-text"><Flame size={18} weight="fill" /> {streak} {streak === 1 ? "день" : streak >= 2 && streak <= 4 ? "дня" : "дней"} подряд</span>
      </div>

      <section className="relative overflow-hidden rounded-[2rem] bg-ink p-6 text-bg md:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, var(--fire), transparent 65%)" }} />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="relative">
            <Gauge value={pred.band} target={user.targetBand} />
            <p className="display absolute inset-x-0 bottom-0 text-center text-4xl font-extrabold">{pred.band !== null ? formatBand(pred.band) : "?"}</p>
          </div>
          <div className="min-w-0 flex-1 basis-52">
            <p className="text-sm font-bold opacity-70">Прогноз IELTS</p>
            <p className="display mt-1 text-2xl font-bold">
              {pred.band === null ? `Цель: Band ${formatBand(user.targetBand)}` : gap === 0 ? "Цель взята. Удержи планку." : `Сейчас ${formatBand(pred.band)}, ещё ${formatBand(gap!)} до цели`}
            </p>
            <p className="mt-1 opacity-75">{pred.band === null ? "Пройди первый замер, и здесь появится прогноз." : pred.measured < 4 ? `Измерено секций: ${pred.measured} из 4.` : "По последним пяти результатам каждой секции."}</p>
          </div>
          <Link href={daysLeft !== null ? "/app/progress" : "/app/profile#exam"} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-sm font-bold transition hover:bg-white/10">
            <CalendarBlank size={18} /> {daysLeft !== null ? `До экзамена ${daysLeft} дн.` : "Выбрать дату экзамена"}
          </Link>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="display text-xl font-bold">{diagnostic ? "Замер уровня" : "План на сегодня"}</h2>
            <p className="text-sm font-bold text-muted">{done}/{plan.length} выполнено</p>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-fire transition-[width] duration-700" style={{ width: `${plan.length ? (done / plan.length) * 100 : 0}%` }} /></div>
          {diagnostic && <p className="mt-3 text-sm text-muted">Пока план стандартный. После замера каждой секции он подстроится под твои реальные уровни.</p>}
          <ul className="mt-4 grid gap-3">
            {plan.map((t) => {
              const Icon = ICON[t.kind];
              return (
                <li key={t.id}>
                  <Link href={t.href} className={`card flex items-center gap-4 p-4 transition hover:-translate-y-0.5 sm:p-5 ${t.done ? "opacity-70" : ""}`}>
                    <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${t.done ? "bg-ok-soft text-ok" : "bg-fire-soft text-fire-text"}`}>
                      {t.done ? <CheckCircle size={24} weight="fill" /> : <Icon size={24} weight="duotone" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block font-bold ${t.done ? "line-through decoration-2" : ""}`}>{t.title}</span>
                      <span className="block truncate text-sm text-muted">{t.detail} · {t.minutes} мин</span>
                    </span>
                    <ArrowRight size={20} className="shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <aside className="grid content-start gap-3">
          <Link href="/app/lexi" className="relative overflow-hidden rounded-[2rem] p-6 text-[#1b1433] transition hover:-translate-y-0.5" style={{ background: "linear-gradient(140deg, var(--fire-2), var(--fire))" }}>
            <Mascot animated className="absolute -bottom-3 -right-2 w-24" />
            <p className="display text-xl font-bold">Поговори с Lexi</p>
            <p className="mt-1 max-w-[22ch] text-sm font-semibold">Разговор вслух с разбором ошибок. Выбери характер: от доброго до саркастичного.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold">Начать разговор <ArrowRight size={14} weight="bold" /></span>
          </Link>
          <Link href="/app/words" className="card flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
            <span className="grid size-11 place-items-center rounded-2xl bg-surface-2"><CardsThree size={24} weight="duotone" /></span>
            <span className="flex-1"><span className="block font-bold">Словарь</span><span className="text-sm text-muted">{dueWords ? `${dueWords} карточек на повторение` : "Сейчас нечего повторять"}</span></span>
            <ArrowRight size={18} />
          </Link>
          <section className="card p-5">
            <div className="flex items-center justify-between"><h2 className="font-bold">Последние тесты</h2><Link href="/app/progress" className="text-sm font-bold text-fire-text">Вся статистика</Link></div>
            {recent.length ? (
              <ul className="mt-3 grid gap-2">
                {recent.map((r) => (
                  <li key={r.id}>
                    <Link href={`/app/results/${r.id}`} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-surface-2">
                      <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-semibold">{catalogItem(r.taskId)?.title ?? SKILL_RU[r.section as Skill]}</span><span className="text-xs text-muted">{SKILL_RU[r.section as Skill]} · {r.createdAt.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</span></span>
                      <span className="display text-lg font-extrabold">{formatBand(r.band)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-sm text-muted">Пробных тестов пока нет. Начни с первого задания плана.</p>}
          </section>
        </aside>
      </div>
    </div>
  );
  if (isPremium(user)) return body;

  // Free: the games work, the rest of the page shows through a blur under the Premium card
  return (
    <div className="grid gap-6">
      <section>
        <h1 className="display text-3xl font-bold md:text-4xl">Привет, {user.name}!</h1>
        <p className="mt-1 text-muted">Игры открыты бесплатно. Тесты, Lexi, словарь и статистика — в Premium.</p>
        <div className="mt-5"><GameTiles /></div>
      </section>
      <div className="relative">
        <div aria-hidden className="pointer-events-none max-h-[640px] select-none overflow-hidden opacity-70 blur-[6px]">{body}</div>
        <div className="absolute inset-0 flex items-start justify-center pt-8"><PremiumCard section="home" /></div>
      </div>
    </div>
  );
}
