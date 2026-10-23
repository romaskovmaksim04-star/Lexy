"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, BookOpenText, Headphones, Microphone, PencilLine } from "@phosphor-icons/react";
import { useCalm } from "@/lib/motion-pref";
import { FireSpirit } from "@/components/fx/FireSpirit";

const ease = [0.22, 1, 0.36, 1] as const;

// Stickers of the four sections around the flame, like stickers on a notebook cover
const STICKERS = [
  { label: "Speaking", icon: Microphone, cls: "left-[2%] top-[24%] -rotate-[8deg]", delay: 0 },
  { label: "Writing", icon: PencilLine, cls: "right-[0%] top-[14%] rotate-[7deg]", delay: 0.6 },
  { label: "Reading", icon: BookOpenText, cls: "left-[-4%] bottom-[22%] rotate-[5deg]", delay: 1.2 },
  { label: "Listening", icon: Headphones, cls: "right-[-2%] bottom-[30%] -rotate-[6deg]", delay: 1.8 },
];

export function Hero({ signedIn }: { signedIn: boolean }) {
  const calm = useCalm();
  const enter = (delay: number) => ({
    initial: { opacity: 0, y: calm ? 0 : 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease },
  });

  // Layout and words from Maks's landing: a big two-line promise, two pill buttons and a
  // stats row on the left, the living flame on the right.
  return (
    <section className="relative">
      <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 pb-12 pt-8 md:px-8 md:pt-12 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1.25fr_0.95fr] lg:pb-16 lg:pt-0">
        <div className="order-2 lg:order-1">
          <motion.h1 {...enter(0.05)} className="display text-[40px] font-extrabold leading-[1.02] sm:text-6xl xl:text-[76px]">
            Нужный балл IELTS
            <span className="block text-fire">с первой попытки</span>
          </motion.h1>
          <motion.p {...enter(0.2)} className="mt-6 max-w-[44ch] text-lg leading-relaxed text-muted md:text-xl">
            ИИ-тренажёр для Academic и General Training. Все четыре секции, живой голосовой репетитор Lexi, разбор ошибок и пробные экзамены в одном приложении.
          </motion.p>
          <motion.div {...enter(0.32)} className="mt-9 flex flex-wrap gap-3">
            <Link href={signedIn ? "/app" : "/quiz"} className="btn btn-fire px-7 py-4 text-base uppercase tracking-wide">
              {signedIn ? "Мой план" : "Начать подготовку"} <ArrowRight size={18} weight="bold" />
            </Link>
            <Link href="/games" className="btn btn-ghost px-7 py-4 text-base uppercase tracking-wide">Посмотреть игры</Link>
          </motion.div>
          <motion.dl {...enter(0.44)} className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
            {[["4", "секции экзамена"], ["7", "характеров Lexi"], ["3", "игры на слабые места"]].map(([n, t]) => (
              <div key={t}>
                <dt className="sr-only">{t}</dt>
                <dd className="display text-4xl font-extrabold">{n}</dd>
                <dd className="text-sm text-muted">{t}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div
          className="relative order-1 mx-auto w-full max-w-[230px] sm:max-w-[320px] lg:order-2 lg:max-w-[420px]"
          initial={{ opacity: 0, scale: calm ? 1 : 0.85, y: calm ? 0 : 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 90, damping: 14, delay: 0.15 }}
        >
          <div aria-hidden className="halo pointer-events-none absolute inset-[6%] rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, rgb(255 122 46 / 0.30), rgb(255 154 10 / 0.08) 60%, transparent)" }} />
          <FireSpirit />
          {STICKERS.map((s) => (
            <motion.a
              key={s.label}
              href="#platform"
              className={`absolute hidden items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-sm font-bold shadow-[0_14px_30px_-16px_rgb(var(--shadow)/0.55)] sm:inline-flex ${s.cls}`}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={calm ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1, y: [0, -8, 0] }}
              transition={calm ? { duration: 0.4 } : { opacity: { duration: 0.5, delay: 0.6 + s.delay * 0.3 }, scale: { type: "spring", stiffness: 260, damping: 14, delay: 0.6 + s.delay * 0.3 }, y: { duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: s.delay } }}
              whileHover={calm ? undefined : { scale: 1.08, rotate: 0 }}
            >
              <s.icon size={16} weight="fill" className="text-fire-text" /> {s.label}
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
