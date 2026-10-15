"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { BookOpenText, Cards, Headphones, Microphone, PencilLine, Play } from "@phosphor-icons/react";
import { WORDS } from "@/lib/content/words";
import { Reveal } from "@/components/ui/Reveal";

const ESSAY = [
  { t: "Free higher education gives talented students from poor families a fair chance. " },
  { t: "However", link: true },
  { t: ", universities need substantial funding, " },
  { t: "which", link: true },
  { t: " means the burden falls on taxpayers. " },
  { t: "As a result", link: true },
  { t: ", a small fee may be the fairest option." },
];

const BARS = [0.35, 0.7, 0.5, 0.95, 0.6, 0.8, 0.4, 0.9, 0.55, 0.75, 0.3, 0.65, 0.85, 0.45, 0.7, 0.5, 0.9, 0.6];

function Waveform() {
  const reduce = useReducedMotion();
  return (
    <div className="flex h-20 items-center gap-1.5" aria-hidden>
      {BARS.map((h, i) => (
        <motion.span
          key={i}
          className="w-1.5 rounded-full bg-[#1b1433]/80"
          style={{ height: `${h * 100}%`, originY: 0.5 }}
          animate={reduce ? undefined : { scaleY: [1, 0.35 + ((i * 7) % 5) / 8, 1] }}
          transition={{ duration: 1.1 + (i % 4) * 0.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
        />
      ))}
    </div>
  );
}

function TfngDemo() {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="mt-5">
      <p className="text-[15px] leading-snug">Students usually find tests easier than rereading.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {["TRUE", "FALSE", "NOT GIVEN"].map((o) => {
          const state = picked === o ? (o === "FALSE" ? "ok" : "bad") : null;
          return (
            <button
              key={o}
              type="button"
              onClick={() => setPicked(o)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition active:scale-95 ${
                state === "ok" ? "border-ok bg-ok-soft text-ok" : state === "bad" ? "border-bad bg-bad-soft text-bad" : "border-line bg-surface hover:border-ink/30"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
      <p className="mt-3 min-h-5 text-xs text-muted" aria-live="polite">
        {picked === "FALSE" ? "Верно: в тексте тест «feels harder»." : picked ? "Попробуй ещё: что текст говорит про тест?" : "Нажми на ответ"}
      </p>
    </div>
  );
}

function WordCard({ i }: { i: number }) {
  const w = WORDS[i];
  const [flip, setFlip] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setFlip((f) => !f)}
      className="group w-56 shrink-0 snap-start rounded-3xl border border-line bg-surface p-5 text-left transition hover:-translate-y-1"
      aria-label={`${w.en}: показать перевод`}
    >
      <p className="display text-lg font-bold">{w.en}</p>
      <p className="mt-0.5 text-xs text-muted">/{w.ipa}/</p>
      <p className={`mt-5 text-sm font-semibold transition ${flip ? "text-fire-text" : "text-muted"}`}>{flip ? w.ru : "Нажми, чтобы перевернуть"}</p>
    </button>
  );
}

export function Platform() {
  return (
    <section id="platform" className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
      <Reveal>
        <h2 className="display max-w-[18ch] text-3xl font-bold leading-[1.1] md:text-5xl">Все четыре секции экзамена в одном месте</h2>
        <p className="mt-5 max-w-[56ch] text-lg text-muted">Задания в формате IELTS, а после каждого понятно, где ты теряешь баллы.</p>
      </Reveal>

      <div className="mt-12 grid gap-4 md:grid-cols-4 md:grid-rows-[auto_auto_auto]">
        <Reveal className="md:col-span-2 md:row-span-2">
          <div className="relative flex h-full min-h-[380px] flex-col overflow-hidden rounded-3xl p-7 text-[#1b1433] md:p-9" style={{ background: "linear-gradient(150deg, #ffb340 0%, #ff6a2b 55%, #f04a12 100%)" }}>
            <Microphone size={30} weight="duotone" />
            <h3 className="display mt-5 text-2xl font-bold md:text-3xl">Speaking голосом</h3>
            <p className="mt-3 max-w-[36ch] text-[17px] leading-relaxed text-[#1b1433]/85">
              Отвечаешь на вопросы всех трёх частей. Lexy расшифровывает речь, считает темп, паузы и слова-паразиты.
            </p>
            <div className="mt-auto pt-8"><Waveform /></div>
            <div className="mt-5 rounded-2xl bg-[#fffefe]/85 px-4 py-3 text-[15px] font-medium">
              Describe a place in your city where you like to spend time.
            </div>
          </div>
        </Reveal>

        <Reveal className="md:col-span-2" delay={0.08}>
          <div className="card h-full p-7">
            <div className="flex items-center gap-3">
              <PencilLine size={26} weight="duotone" className="text-fire-text" />
              <h3 className="display text-xl font-bold">Writing с разбором</h3>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              {ESSAY.map((p, i) =>
                p.link ? <mark key={i} className="rounded-md bg-fire-soft px-1 font-semibold text-ink">{p.t}</mark> : <span key={i}>{p.t}</span>,
              )}
            </p>
            <p className="mt-4 text-sm font-semibold">Оценка по четырём критериям, повторы и связки подсвечены.</p>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="card h-full p-6">
            <div className="flex items-center gap-3">
              <BookOpenText size={24} weight="duotone" className="text-fire-text" />
              <h3 className="display text-lg font-bold">Reading</h3>
            </div>
            <TfngDemo />
          </div>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="h-full rounded-3xl bg-ink p-6 text-bg">
            <div className="flex items-center gap-3">
              <Headphones size={24} weight="duotone" className="text-fire" />
              <h3 className="display text-lg font-bold">Listening</h3>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-fire text-[#1b1433]"><Play size={16} weight="fill" /></span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-bg/20"><div className="h-full w-2/5 rounded-full bg-fire" /></div>
            </div>
            <p className="mt-5 font-mono text-sm">Phone: 07931 <span className="border-b-2 border-fire px-6" /></p>
            <p className="mt-3 text-sm opacity-75">Диалоги с ловушками: цифры, имена по буквам, исправления.</p>
          </div>
        </Reveal>

        <Reveal className="md:col-span-4" delay={0.1}>
          <div className="rounded-3xl bg-surface-2 p-6 md:p-8">
            <div className="flex items-center gap-3">
              <Cards size={26} weight="duotone" className="text-fire-text" />
              <h3 className="display text-xl font-bold">Слова, которые возвращаются вовремя</h3>
            </div>
            <p className="mt-2 max-w-[60ch] text-muted">Карточки с интервальным повторением: слово приходит снова, когда ты начинаешь его забывать.</p>
            <div className="no-scrollbar -mx-6 mt-6 flex snap-x gap-3 overflow-x-auto px-6 pb-2 md:-mx-8 md:px-8">
              {[41, 24, 12, 8, 39, 30].map((i) => <WordCard key={i} i={i} />)}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
