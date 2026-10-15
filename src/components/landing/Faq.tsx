"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Plus } from "@phosphor-icons/react";

const ITEMS = [
  { q: "Подходит для Academic и General Training?", a: "Да. В начале выбираешь формат, и Reading и Writing подстраиваются под него. Listening и Speaking в обоих форматах одинаковые." },
  { q: "Как Lexy оценивает Writing и Speaking?", a: "Текст и расшифровку речи разбираем по критериям IELTS: объём, связки, разнообразие лексики, длина и сложность предложений, темп речи. Это ориентир для тренировки, а не оценка экзаменатора." },
  { q: "Нужен микрофон?", a: "Для Speaking да, подойдёт микрофон телефона или наушников. Всё остальное работает без него." },
  { q: "Можно заниматься с телефона?", a: "Да, сайт сделан в первую очередь под телефон. Открываешь, видишь план на сегодня, занимаешься." },
  { q: "С какого уровня начинать?", a: "Если ты читаешь простые тексты на английском, можно начинать. План строится от твоего целевого балла и даты экзамена." },
  { q: "Сколько нужно заниматься?", a: "Сколько выберешь в тесте: от 15 минут до двух часов в день. Важнее регулярность, поэтому Lexy считает серию дней." },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();
  return (
    <section id="faq" className="mx-auto grid max-w-7xl gap-10 px-4 py-20 md:px-8 md:py-28 lg:grid-cols-[0.8fr_1.2fr]">
      <h2 className="display text-3xl font-bold leading-[1.1] md:text-5xl lg:sticky lg:top-28 lg:self-start">Частые вопросы</h2>
      <div className="divide-y divide-line border-y border-line">
        {ITEMS.map((it, i) => {
          const isOpen = open === i;
          return (
            <div key={it.q}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-6 py-6 text-left"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span className="text-lg font-semibold md:text-xl">{it.q}</span>
                <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: reduce ? 0 : 0.3 }} className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2">
                  <Plus size={18} weight="bold" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={reduce ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={reduce ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-[60ch] pb-6 leading-relaxed text-muted">{it.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
