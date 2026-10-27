import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, Lock, Play, Trophy } from "@phosphor-icons/react/dist/ssr";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLevel, lessonAt, LESSONS_PER_LEVEL } from "@/lib/course/course";
import { LEVELS, type Level } from "@/lib/course/types";
import { premiumGate } from "@/components/app/PremiumWall";
import { LevelPicker } from "./LevelPicker";

export const metadata: Metadata = { title: "Курс английского" };

const ABOUT: Record<Level, string> = {
  A1: "Начальный: to be, простые времена, базовые слова",
  A2: "Элементарный: прошедшее время, сравнения, быт",
  B1: "Средний: будущее, условные, работа и учёба",
  B2: "Выше среднего: пассив, модальные, абстрактные темы",
  C1: "Продвинутый: тонкости грамматики, академическая лексика",
};

export default async function CoursePage({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const wall = await premiumGate("course");
  if (wall) return wall;
  const user = (await currentUser())!;
  const open = LEVELS.indexOf(isLevel(user.courseLevel) ? user.courseLevel : "A1");
  const asked = (await searchParams).level ?? "";
  const level: Level = isLevel(asked) && LEVELS.indexOf(asked) <= open ? asked : LEVELS[open];
  const results = await db.lessonResult.findMany({ where: { userId: user.id } });
  const done = (lv: string) => results.filter((r) => r.level === lv && r.lesson > 0);
  const passed = new Set(results.filter((r) => r.lesson === 0 && r.right >= Math.ceil(r.total * 0.85)).map((r) => r.level));
  const doneHere = new Set(done(level).map((r) => r.lesson));
  const nextN = Array.from({ length: LESSONS_PER_LEVEL }, (_, k) => k + 1).find((k) => !doneHere.has(k)) ?? null;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-3xl font-bold md:text-4xl">Курс английского</h1>
          <p className="mt-1 text-muted">30 уроков на уровень. Сдай тест уровня на 85%, и откроется следующий.</p>
        </div>
        <LevelPicker current={LEVELS[open]} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {LEVELS.map((lv, k) => {
          const locked = k > open;
          const on = lv === level;
          return (
            <Link key={lv} href={locked ? "#" : `/app/course?level=${lv}`} aria-disabled={locked}
              className={`flex shrink-0 items-center gap-2 rounded-2xl border-2 px-4 py-3 font-bold ${on ? "border-fire bg-fire-soft text-fire-text" : "border-line"} ${locked ? "pointer-events-none opacity-50" : ""}`}>
              {locked ? <Lock size={16} weight="fill" /> : passed.has(lv) ? <Trophy size={16} weight="fill" className="text-ok" /> : null}
              {lv}<span className="text-xs font-semibold text-muted">{done(lv).length}/{LESSONS_PER_LEVEL}</span>
            </Link>
          );
        })}
      </div>

      <section className="relative overflow-hidden rounded-[2rem] bg-ink p-6 text-bg md:p-8">
        <p className="text-sm font-bold opacity-70">Уровень {level}</p>
        <p className="display mt-1 text-2xl font-bold">{ABOUT[level]}</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-fire" style={{ width: `${(doneHere.size / LESSONS_PER_LEVEL) * 100}%` }} /></div>
        <div className="mt-5 flex flex-wrap gap-3">
          {nextN && <Link href={`/app/course/${level}/${nextN}`} className="btn btn-fire"><Play size={18} weight="fill" /> Урок {nextN}: {lessonAt(level, nextN).t}</Link>}
          <Link href={`/app/course/${level}/test`} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-sm font-bold hover:bg-white/10"><Trophy size={18} /> {passed.has(level) ? "Тест сдан · пересдать" : "Тест уровня"}</Link>
        </div>
      </section>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: LESSONS_PER_LEVEL }, (_, k) => k + 1).map((k) => {
          const r = done(level).find((x) => x.lesson === k);
          const avail = k === 1 || doneHere.has(k - 1) || doneHere.has(k);
          const body = (
            <>
              <span className={`grid size-10 shrink-0 place-items-center rounded-2xl text-sm font-extrabold ${r ? "bg-ok-soft text-ok" : avail ? "bg-fire-soft text-fire-text" : "bg-surface-2 text-muted"}`}>
                {r ? <CheckCircle size={22} weight="fill" /> : avail ? k : <Lock size={16} weight="fill" />}
              </span>
              <span className="min-w-0 flex-1"><span className="block truncate font-bold">{lessonAt(level, k).t}</span><span className="text-sm text-muted">Урок {k}{r ? ` · ${r.right}/${r.total}` : ""}</span></span>
            </>
          );
          return (
            <li key={k}>
              {avail
                ? <Link href={`/app/course/${level}/${k}`} className="card flex items-center gap-3 p-4 transition hover:-translate-y-0.5">{body}</Link>
                : <div className="card flex items-center gap-3 p-4 opacity-60">{body}</div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
