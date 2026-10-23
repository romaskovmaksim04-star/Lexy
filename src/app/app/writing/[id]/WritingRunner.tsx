"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { WritingPrompt } from "@/lib/content/prompts";
import { TestBar } from "@/components/app/TestBar";
import { ChartView } from "@/components/app/ChartView";
import { submitEssay } from "@/app/actions";

const TIPS = [
  "Совет: в Task 1 всегда начинай с обзора (overview). Без него Task Achievement не выше 5.",
  "Факт: Task 2 весит в два раза больше, чем Task 1.",
  "Совет: один абзац = одна мысль. Начинай абзац с главного предложения.",
  "Факт: грамматическая точность важнее сложных конструкций с ошибками.",
  "Совет: перефразируй задание во вступлении, не переписывай его слово в слово.",
  "Совет: связки furthermore, consequently, nevertheless показывают логику, но не ставь их в каждое предложение.",
];

function count(text: string) {
  return (text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) ?? []).length;
}

export function WritingRunner({ prompt }: { prompt: WritingPrompt }) {
  const router = useRouter();
  const key = `lexy-essay-${prompt.id}`;
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [tip, setTip] = useState(0);
  const [warn, setWarn] = useState(false);
  const started = useRef(Date.now());
  const words = count(text);
  const under = words < prompt.minWords;

  useEffect(() => {
    try { const saved = localStorage.getItem(key); if (saved) setText(saved); } catch { /* private mode */ }
  }, [key]);
  useEffect(() => {
    const t = setTimeout(() => { try { localStorage.setItem(key, text); } catch { /* private mode */ } }, 400);
    return () => clearTimeout(t);
  }, [text, key]);
  useEffect(() => {
    if (!sending) return;
    const t = setInterval(() => setTip((i) => (i + 1) % TIPS.length), 2600);
    return () => clearInterval(t);
  }, [sending]);

  const submit = async () => {
    if (under && !warn) {
      setWarn(true);
      return;
    }
    setSending(true);
    setError("");
    const r = await submitEssay(prompt.id, text, (Date.now() - started.current) / 60000);
    if (r.id) {
      try { localStorage.removeItem(key); } catch { /* private mode */ }
      router.push(`/app/results/${r.id}`);
      return;
    }
    setSending(false);
    setError(r.error === "limit" ? "limit" : r.error ?? "Не удалось отправить. Попробуй ещё раз.");
  };

  if (sending) {
    return (
      <div className="grid min-h-[60dvh] place-items-center text-center">
        <div className="grid justify-items-center gap-5">
          <div className="size-14 animate-spin rounded-full border-4 border-fire-soft border-t-fire calm:animate-none" aria-hidden />
          <p className="display text-xl font-bold">Проверяем эссе</p>
          <p className="max-w-[46ch] text-muted" aria-live="polite">{TIPS[tip]}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TestBar title={`Writing ${prompt.task === "task1" ? "Task 1" : "Task 2"}: ${prompt.type}`} minutes={prompt.minutes} onSubmit={submit} submitLabel="Отправить" />
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <section className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-sm font-semibold text-muted">
            Задание · {prompt.minutes} минут · минимум {prompt.minWords} слов
          </p>
          <div className="card mt-3 whitespace-pre-line p-6 text-[16px] leading-relaxed">{prompt.text}</div>
          {prompt.chart && <div className="card mt-4 p-4"><ChartView chart={prompt.chart} /></div>}
        </section>

        <section>
          <label htmlFor="essay" className="label">Твой ответ</label>
          <textarea
            id="essay"
            value={text}
            onChange={(e) => { setText(e.target.value); setWarn(false); }}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="sentences"
            placeholder="Начни писать здесь…"
            className="field mt-2 min-h-[55dvh] resize-y text-[16px] leading-relaxed"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className={`text-sm font-bold ${under ? "text-muted" : "text-ok"}`} aria-live="polite">
              {words} {under ? `из ${prompt.minWords} слов` : "слов, минимум есть"}
            </p>
            <button onClick={submit} className="btn btn-fire">Отправить на проверку</button>
          </div>
          {warn && (
            <div role="alert" className="mt-4 rounded-3xl bg-fire-soft p-5 text-[15px]">
              <p className="font-bold">Меньше {prompt.minWords} слов</p>
              <p className="mt-1">На экзамене за это снижают балл. Отправить всё равно?</p>
              <div className="mt-3 flex gap-2">
                <button onClick={submit} className="btn btn-ink btn-sm">Отправить</button>
                <button onClick={() => setWarn(false)} className="btn btn-ghost btn-sm">Дописать</button>
              </div>
            </div>
          )}
          {error && (
            <div role="alert" className="mt-4 rounded-3xl bg-bad-soft p-5 text-[15px] text-bad">
              {error === "limit" ? (
                <>Бесплатные проверки эссе на сегодня закончились. <Link href="/pricing" className="font-bold underline">Premium</Link> даёт до 30 проверок в день. Текст сохранён.</>
              ) : error}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
