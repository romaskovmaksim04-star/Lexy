"use client";

import { useCalm } from "@/lib/motion-pref";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Sparkle } from "@phosphor-icons/react";
import { checkText, type Issue } from "@/lib/grammar";
import { LiveMascot } from "./LiveMascot";
import { kickEmbers } from "./EmberSky";

// The landing's live demo: the same mistake checker the platform uses, running in the
// browser as the visitor types. The flame reacts to what it finds.

const SAMPLES = [
  "I am agree that people is more happy in small towns.",
  "My brother don't like to make photos, but he enjoy to travel.",
  "I have lived in Moscow since five years and I didn't went abroad.",
  "If I will pass IELTS, I will can to study in London.",
];

function Marked({ text, issues }: { text: string; issues: Issue[] }) {
  const out: React.ReactNode[] = [];
  let pos = 0;
  issues.forEach((i, k) => {
    if (i.index < pos) return;
    out.push(text.slice(pos, i.index));
    out.push(
      <span key={k} className="rounded-md bg-bad-soft px-1 text-bad underline decoration-bad decoration-wavy decoration-2 underline-offset-4">{i.original}</span>,
    );
    pos = i.index + i.original.length;
  });
  out.push(text.slice(pos));
  return <>{out}</>;
}

export function FixDemo() {
  const reduce = useCalm();
  const [text, setText] = useState(SAMPLES[0]);
  const [debounced, setDebounced] = useState(SAMPLES[0]);
  const hadErrors = useRef(true);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(text), 220);
    return () => clearTimeout(t);
  }, [text]);

  const issues = useMemo(() => checkText(debounced, "speaking").filter((i) => i.kind !== "style"), [debounced]);
  const words = (debounced.match(/[A-Za-z']+/g) ?? []).length;
  const clean = issues.length === 0 && words >= 5;
  const mood = issues.length ? "worried" : clean ? "happy" : "calm";

  useEffect(() => {
    if (clean && hadErrors.current) kickEmbers(1.6);
    hadErrors.current = issues.length > 0;
  }, [clean, issues.length]);

  const fixedText = useMemo(() => {
    let out = debounced;
    for (const i of [...issues].sort((a, b) => b.index - a.index)) out = out.slice(0, i.index) + i.fix + out.slice(i.index + i.original.length);
    return out;
  }, [debounced, issues]);

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1fr_300px] lg:gap-12">
      <div className="glass rounded-[2rem] p-5 sm:p-7">
        <label htmlFor="fix-demo" className="label">Напиши фразу по-английски</label>
        <textarea
          id="fix-demo"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 400))}
          rows={3}
          spellCheck={false}
          autoCorrect="off"
          className="field mt-2 resize-none text-lg leading-relaxed"
        />
        <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {SAMPLES.map((s) => (
            <button key={s} type="button" onClick={() => setText(s)} className="shrink-0 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-muted transition hover:border-fire hover:text-ink">
              {s.length > 34 ? `${s.slice(0, 32)}…` : s}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-3xl bg-surface p-5" aria-live="polite">
          <p className="text-lg leading-[1.9]"><Marked text={debounced} issues={issues} /></p>
          <AnimatePresence mode="popLayout" initial={false}>
            {issues.length > 0 ? (
              <motion.ul key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 grid gap-2.5 border-t border-line pt-4">
                {issues.slice(0, 5).map((i) => (
                  <motion.li key={i.rule + i.index} layout={!reduce} initial={{ opacity: 0, y: reduce ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} className="grid gap-0.5">
                    <p className="text-[15px]"><span className="text-bad line-through">{i.original}</span> <ArrowRight size={13} className="mx-1 inline" /> <span className="font-bold text-ok">{i.fix}</span></p>
                    <p className="text-sm text-muted">{i.why}</p>
                  </motion.li>
                ))}
                {issues.length > 1 && (
                  <li className="mt-1 rounded-2xl bg-ok-soft p-3 text-[15px]"><span className="font-bold text-ok">Правильно:</span> {fixedText}</li>
                )}
              </motion.ul>
            ) : (
              <motion.p key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 flex items-center gap-2 border-t border-line pt-4 font-bold text-ok">
                <Sparkle size={18} weight="fill" /> {clean ? "Ошибок не нашли. Огонёк доволен!" : "Пиши дальше, проверка идёт на ходу."}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[300px] justify-items-center gap-5 text-center">
        <LiveMascot mood={mood} sayOnTap={false} className="w-44 sm:w-52" />
        <p className="display text-xl font-bold">
          {issues.length ? `Ошибок: ${issues.length}` : clean ? "Чисто!" : "Жду фразу"}
        </p>
        <p className="text-sm text-muted">Так же LexiUp разбирает каждое эссе и каждый ответ в Speaking, только по всем четырём критериям IELTS.</p>
        <Link href="/quiz" className="btn btn-fire">Проверить эссе <ArrowRight size={16} weight="bold" /></Link>
      </div>
    </div>
  );
}
