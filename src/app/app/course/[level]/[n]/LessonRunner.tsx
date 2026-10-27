"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, SpeakerHigh, XCircle } from "@phosphor-icons/react";
import { finishLesson } from "@/app/actions";
import type { Mcq } from "@/lib/course/types";
import type { Step } from "@/lib/course/course";

// One runner for lessons and level tests. Quiz, reading and listening answers are scored on
// the server; ordering, typing and matching are practice and checked here.

export type RunStep = Step & { audio?: string; exampleAudio?: string[] };

const NAME: Record<Step["kind"], string> = {
  theory: "Теория", quiz: "Вопросы", order: "Собери фразу", typing: "Напиши перевод",
  match: "Найди пары", reading: "Чтение", listening: "Аудирование",
};

function play(src?: string) {
  if (src) new Audio(src).play().catch(() => {});
}

export function LessonRunner({ level, n, title, steps, nextHref }: { level: string; n: number; title: string; steps: RunStep[]; nextHref: string | null }) {
  const [i, setI] = useState(0);
  const answers = useRef<(number | null)[]>([]);
  const [result, setResult] = useState<{ right: number; total: number; passed: boolean; unlocked?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const step = steps[i];

  const next = async () => {
    if (i + 1 < steps.length) { setI(i + 1); window.scrollTo(0, 0); return; }
    setSaving(true);
    setResult(await finishLesson(level, n, answers.current).finally(() => setSaving(false)));
  };

  if (result) {
    const pct = Math.round((result.right / Math.max(1, result.total)) * 100);
    return (
      <div className="card mx-auto grid max-w-md gap-3 p-8 text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-muted">{n === 0 ? `Тест уровня ${level}` : `Урок ${n} · ${level}`}</p>
        <p className="display text-5xl font-extrabold">{pct}%</p>
        <p className="text-muted">Верно {result.right} из {result.total}</p>
        <p className={`font-bold ${result.passed ? "text-ok" : "text-bad"}`}>
          {result.unlocked ? `Уровень сдан! Открыт ${result.unlocked}` : result.passed ? (n === 0 ? "Тест сдан" : "Урок пройден") : n === 0 ? "Нужно 85%. Повтори уроки и попробуй снова" : "Нужно 70%, попробуй ещё раз"}
        </p>
        <div className="mt-2 grid gap-2">
          {result.passed && nextHref && <Link href={nextHref} className="btn btn-fire justify-center">Дальше <ArrowRight size={18} /></Link>}
          {!result.passed && <button onClick={() => { answers.current = []; setResult(null); setI(0); }} className="btn btn-fire justify-center">Ещё раз</button>}
          <Link href="/app/course" className="btn btn-ghost justify-center">К курсу</Link>
        </div>
      </div>
    );
  }

  // Scored questions before this step, so every step writes into its own slice of answers
  const offset = steps.slice(0, i).reduce((a, s) => a + ("questions" in s ? s.questions.length : 0), 0);

  return (
    <div className="mx-auto grid max-w-2xl gap-5">
      <div>
        <div className="flex items-center justify-between text-sm font-bold text-muted">
          <span>{title}</span><span>{i + 1}/{steps.length}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-fire transition-[width]" style={{ width: `${(i / steps.length) * 100}%` }} /></div>
      </div>
      <p className="text-xs font-bold uppercase tracking-wide text-fire-text">{NAME[step.kind]}</p>
      <StepView key={i} step={step} onAnswer={(k, v) => { answers.current[offset + k] = v; }} onDone={next} busy={saving} />
    </div>
  );
}

function StepView({ step, onAnswer, onDone, busy }: { step: RunStep; onAnswer: (k: number, v: number) => void; onDone: () => void; busy: boolean }) {
  switch (step.kind) {
    case "theory":
      return (
        <div className="card grid gap-4 p-6">
          <h1 className="display text-2xl font-bold">{step.title}</h1>
          <p className="leading-relaxed">{step.text}</p>
          <ul className="grid gap-2">
            {step.examples.map((e, k) => (
              <li key={k}><button onClick={() => play(step.exampleAudio?.[k])} className="flex w-full items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3 text-left font-semibold">
                <SpeakerHigh size={20} className="shrink-0 text-fire-text" /> {e}
              </button></li>
            ))}
          </ul>
          <Next onClick={onDone} busy={busy} />
        </div>
      );
    case "quiz":
      return <Questions questions={step.questions} onAnswer={onAnswer} onDone={onDone} busy={busy} />;
    case "reading":
      return (
        <div className="grid gap-4">
          <div className="card p-6"><h2 className="display text-xl font-bold">{step.title}</h2><p className="mt-3 leading-relaxed">{step.passage}</p></div>
          <Questions questions={step.questions} onAnswer={onAnswer} onDone={onDone} busy={busy} />
        </div>
      );
    case "listening":
      return <Listening step={step} onAnswer={onAnswer} onDone={onDone} busy={busy} />;
    case "order":
      return <Order sentence={step.sentence} onDone={onDone} busy={busy} />;
    case "typing":
      return <Typing items={step.items} onDone={onDone} busy={busy} />;
    case "match":
      return <Match pairs={step.pairs} onDone={onDone} busy={busy} />;
  }
}

function Next({ onClick, busy, disabled }: { onClick: () => void; busy?: boolean; disabled?: boolean }) {
  return <button onClick={onClick} disabled={busy || disabled} className="btn btn-fire w-full justify-center py-4">{busy ? "Сохраняю…" : "Дальше"} <ArrowRight size={18} /></button>;
}

function Questions({ questions, onAnswer, onDone, busy }: { questions: Mcq[]; onAnswer: (k: number, v: number) => void; onDone: () => void; busy: boolean }) {
  const [k, setK] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const q = questions[k];
  if (!q) return <Next onClick={onDone} busy={busy} />;
  const pick = (v: number) => { if (picked !== null) return; setPicked(v); onAnswer(k, v); };
  const last = k + 1 >= questions.length;
  return (
    <div className="card grid gap-4 p-6">
      <p className="text-sm font-bold text-muted">Вопрос {k + 1} из {questions.length}</p>
      <h2 className="text-lg font-bold">{q.q}</h2>
      <div className="grid gap-2">
        {q.o.map((o, v) => {
          const tone = picked === null ? "border-line hover:bg-surface-2" : v === q.a ? "border-ok bg-ok-soft" : v === picked ? "border-bad bg-bad-soft" : "border-line opacity-60";
          return (
            <button key={v} onClick={() => pick(v)} className={`flex items-center justify-between rounded-2xl border-2 px-4 py-3 text-left font-semibold transition ${tone}`}>
              {o}{picked !== null && v === q.a && <CheckCircle size={20} weight="fill" className="text-ok" />}{picked === v && v !== q.a && <XCircle size={20} weight="fill" className="text-bad" />}
            </button>
          );
        })}
      </div>
      {picked !== null && <Next onClick={() => { if (last) onDone(); else { setK(k + 1); setPicked(null); } }} busy={busy && last} />}
    </div>
  );
}

function Listening({ step, onAnswer, onDone, busy }: { step: RunStep & { kind: "listening" }; onAnswer: (k: number, v: number) => void; onDone: () => void; busy: boolean }) {
  const [heard, setHeard] = useState(false);
  const [show, setShow] = useState(false);
  return (
    <div className="grid gap-4">
      <div className="card grid gap-3 p-6">
        <button onClick={() => { play(step.audio); setHeard(true); }} className="btn btn-fire justify-center py-4"><SpeakerHigh size={22} weight="fill" /> {heard ? "Слушать ещё раз" : "Слушать"}</button>
        <button onClick={() => setShow(!show)} className="text-sm font-semibold text-muted underline underline-offset-4">{show ? "Скрыть текст" : "Показать текст"}</button>
        {show && <p className="rounded-2xl bg-surface-2 p-4 leading-relaxed">{step.script}</p>}
      </div>
      <Questions questions={step.questions} onAnswer={onAnswer} onDone={onDone} busy={busy} />
    </div>
  );
}

const clean = (s: string) => s.toLowerCase().replace(/[.,!?;:"«»]/g, "").replace(/\s+/g, " ").trim();

function Order({ sentence, onDone, busy }: { sentence: string; onDone: () => void; busy: boolean }) {
  const words = useMemo(() => sentence.replace(/[.!?]$/, "").split(/\s+/), [sentence]);
  // Fixed shuffle so the server render and the browser agree
  const pool = useMemo(() => words.map((w, k) => ({ w, k })).sort((a, b) => ((a.k * 7 + 3) % words.length) - ((b.k * 7 + 3) % words.length)), [words]);
  const [built, setBuilt] = useState<number[]>([]);
  const done = built.length === words.length;
  const right = done && clean(built.map((k) => words[k]).join(" ")) === clean(words.join(" "));
  return (
    <div className="card grid gap-4 p-6">
      <p className="min-h-14 rounded-2xl bg-surface-2 p-4 text-lg font-semibold">{built.map((k) => words[k]).join(" ") || <span className="text-muted">Нажимай слова по порядку</span>}</p>
      <div className="flex flex-wrap gap-2">
        {pool.map(({ w, k }) => (
          <button key={k} disabled={built.includes(k)} onClick={() => setBuilt([...built, k])} className="rounded-full border-2 border-line px-4 py-2 font-semibold disabled:opacity-30">{w}</button>
        ))}
      </div>
      {done && <p className={`font-bold ${right ? "text-ok" : "text-bad"}`}>{right ? "Верно!" : `Правильно: ${sentence}`}</p>}
      <div className="flex gap-2">
        <button onClick={() => setBuilt([])} className="btn btn-ghost">Сбросить</button>
        <div className="flex-1"><Next onClick={onDone} busy={busy} disabled={!done} /></div>
      </div>
    </div>
  );
}

function Typing({ items, onDone, busy }: { items: { w: string; a: string }[]; onDone: () => void; busy: boolean }) {
  const [vals, setVals] = useState(items.map(() => ""));
  const [checked, setChecked] = useState(false);
  const ok = (k: number) => clean(items[k].a).split(/[,(/]/)[0].trim() === clean(vals[k]) || clean(items[k].a) === clean(vals[k]);
  return (
    <div className="card grid gap-4 p-6">
      {items.map((it, k) => (
        <label key={k} className="grid gap-1">
          <span className="font-bold">{it.w}</span>
          <input value={vals[k]} disabled={checked} onChange={(e) => setVals(vals.map((v, j) => (j === k ? e.target.value : v)))} className="field" placeholder="перевод" />
          {checked && <span className={`text-sm font-semibold ${ok(k) ? "text-ok" : "text-bad"}`}>{ok(k) ? "Верно" : `Правильно: ${it.a}`}</span>}
        </label>
      ))}
      {checked ? <Next onClick={onDone} busy={busy} /> : <button onClick={() => setChecked(true)} className="btn btn-fire justify-center py-4">Проверить</button>}
    </div>
  );
}

function Match({ pairs, onDone, busy }: { pairs: [string, string][]; onDone: () => void; busy: boolean }) {
  const right = useMemo(() => pairs.map((p, k) => ({ t: p[1], k })).sort((a, b) => ((a.k * 3 + 1) % pairs.length) - ((b.k * 3 + 1) % pairs.length)), [pairs]);
  const [sel, setSel] = useState<number | null>(null);
  const [done, setDone] = useState<number[]>([]);
  const [miss, setMiss] = useState<number | null>(null);
  const tap = (k: number) => {
    if (sel === null) return;
    if (k === sel) { setDone([...done, k]); setSel(null); } else { setMiss(k); setTimeout(() => setMiss(null), 500); }
  };
  return (
    <div className="card grid gap-4 p-6">
      <div className="grid grid-cols-2 gap-2">
        <div className="grid content-start gap-2">
          {pairs.map((p, k) => (
            <button key={k} disabled={done.includes(k)} onClick={() => setSel(k)} className={`rounded-2xl border-2 px-3 py-3 font-semibold disabled:border-ok disabled:bg-ok-soft disabled:opacity-60 ${sel === k ? "border-fire bg-fire-soft" : "border-line"}`}>{p[0]}</button>
          ))}
        </div>
        <div className="grid content-start gap-2">
          {right.map(({ t, k }) => (
            <button key={k} disabled={done.includes(k)} onClick={() => tap(k)} className={`rounded-2xl border-2 px-3 py-3 font-semibold disabled:border-ok disabled:bg-ok-soft disabled:opacity-60 ${miss === k ? "border-bad" : "border-line"}`}>{t}</button>
          ))}
        </div>
      </div>
      <Next onClick={onDone} busy={busy} disabled={done.length < pairs.length} />
    </div>
  );
}
