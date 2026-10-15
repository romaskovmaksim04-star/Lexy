import Link from "next/link";
import { ArrowRight, CheckCircle, Flame } from "@phosphor-icons/react/dist/ssr";
import { currentUser } from "@/lib/auth";
import { dailyPlan, daysUntilExam, liveStreak, type Skill } from "@/lib/profile";
import { doneToday, sectionStats } from "@/lib/stats";
import { formatBand } from "@/lib/band";

export default async function Today() {
  const user = (await currentUser())!;
  const plan = dailyPlan(user.focusSkill as Skill, user.dailyMinutes);
  const [done, stats] = await Promise.all([doneToday(user.id), sectionStats(user.id)]);
  const days = daysUntilExam(user.examWindow, user.createdAt);
  return (
    <div className="grid gap-8">
      <div>
        <h1 className="display text-3xl font-bold md:text-4xl">Привет, {user.name}</h1>
        <p className="mt-2 text-muted">{days !== null ? `До экзамена примерно ${days} дн. ` : ""}Цель {formatBand(user.targetBand)}.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-3xl bg-fire p-5 text-[#1b1433]"><p className="text-sm font-bold">Серия</p><p className="display mt-1 flex items-center gap-1 text-3xl font-extrabold"><Flame weight="fill" size={26} />{liveStreak(user.streak, user.lastActive)}</p></div>
        <div className="card p-5"><p className="text-sm text-muted">Опыт</p><p className="display mt-1 text-3xl font-extrabold">{user.xp}</p></div>
        <div className="card p-5"><p className="text-sm text-muted">Сейчас</p><p className="display mt-1 text-3xl font-extrabold">{stats.overall !== null ? formatBand(stats.overall) : "—"}</p></div>
        <div className="card p-5"><p className="text-sm text-muted">Цель</p><p className="display mt-1 text-3xl font-extrabold">{formatBand(user.targetBand)}</p></div>
      </div>
      <section>
        <h2 className="display text-xl font-bold">План на сегодня</h2>
        <ul className="mt-4 grid gap-3">
          {plan.map((t) => {
            const ok = done.has(t.href.split("/").pop()!);
            return (
              <li key={t.id}>
                <Link href={t.href} className="card flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
                  {ok ? <CheckCircle size={28} weight="fill" className="text-ok" /> : <span className="size-7 rounded-full border-2 border-line" />}
                  <span className="flex-1"><span className="block font-bold">{t.title}</span><span className="text-sm text-muted">{t.detail} · {t.minutes} мин</span></span>
                  <ArrowRight size={20} />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
