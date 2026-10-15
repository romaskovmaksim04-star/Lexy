"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Microphone } from "@phosphor-icons/react";
import { Mascot } from "@/components/ui/Mascot";
import { analyseSpeech } from "@/lib/analysis";
import { formatBand } from "@/lib/band";

// A real report from the same analyser the app uses, run on a sample answer.
const SAMPLE =
  "I learned to cook properly when I moved to another city for university. At first it was quite difficult, because I had never prepared anything more complex than pasta. However, I watched videos every evening and practised on my flatmates, who were very patient. As a result, I can now make a proper dinner for six people, and I am proud of it because it made me independent.";
const report = analyseSpeech(SAMPLE, 34);

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const reduce = useReducedMotion();
  const enter = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.9, delay, ease } };

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 size-[640px] rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--fire-2) 35%, transparent), transparent 65%)" }}
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-10 md:px-8 md:pt-16 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1.1fr_1fr] lg:pb-24 lg:pt-8">
        <div>
          <motion.h1 {...enter(0)} className="display text-[40px] font-extrabold leading-[1.05] sm:text-5xl lg:text-[64px]">
            Нужный балл IELTS <span className="text-fire-text">с первой попытки</span>
          </motion.h1>
          <motion.p {...enter(0.1)} className="mt-6 max-w-[34ch] text-lg leading-relaxed text-muted md:text-xl">
            План на каждый день и тренажёры всех четырёх секций. Отвечаешь, пишешь и сразу видишь свой балл.
          </motion.p>
          <motion.div {...enter(0.2)} className="mt-9 flex flex-wrap gap-3">
            <Link href="/quiz" className="btn btn-fire px-7 py-4 text-base">
              Начать подготовку <ArrowRight size={18} weight="bold" />
            </Link>
            <Link href="/tools/band" className="btn btn-ghost px-7 py-4 text-base">Посчитать балл</Link>
          </motion.div>
        </div>

        <motion.div
          className="relative mx-auto w-full max-w-[520px]"
          initial={reduce ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.15, ease }}
        >
          <Mascot animated className="bob absolute -left-6 -top-10 z-10 w-28 drop-shadow-[0_24px_30px_rgba(255,90,31,0.35)] sm:-left-14 sm:w-36" />
          <div className="card relative overflow-hidden p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-muted">Speaking, Part 2</p>
                <p className="mt-1 font-semibold">Describe a skill you are proud of</p>
              </div>
              <div className="text-right">
                <p className="display text-5xl font-extrabold leading-none text-fire-text">{formatBand(report.band)}</p>
                <p className="mt-1 text-xs font-semibold text-muted">оценка ответа</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {report.criteria.map((c, i) => (
                <motion.div
                  key={c.key}
                  className="flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3"
                  initial={reduce ? false : { opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + i * 0.12, ease }}
                >
                  <span className="text-[15px] font-medium">{c.title}</span>
                  <span className="display text-lg font-bold">{formatBand(c.band)}</span>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3 border-t border-line pt-5 text-sm text-muted">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-fire text-[#1b1433]">
                <Microphone size={18} weight="fill" />
              </span>
              <span>
                {report.wpm} слов в минуту, связки: <span className="font-semibold text-ink">{report.linkers.slice(0, 3).join(", ")}</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
