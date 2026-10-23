"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "@phosphor-icons/react";

export type ReviewedQuestion = { n: number; prompt: string; given: string; correct: string; ok: boolean; why: string };

export function AnswerReview({ items }: { items: ReviewedQuestion[] }) {
  const wrong = items.filter((i) => !i.ok).length;
  const [filter, setFilter] = useState<"all" | "wrong" | "right">(wrong ? "wrong" : "all");
  const shown = items.filter((i) => (filter === "all" ? true : filter === "wrong" ? !i.ok : i.ok));
  const tabs = [
    { v: "wrong" as const, label: `Неправильные (${wrong})` },
    { v: "right" as const, label: `Правильные (${items.length - wrong})` },
    { v: "all" as const, label: `Все (${items.length})` },
  ];
  return (
    <section>
      <div className="flex flex-wrap gap-2" role="tablist">
        {tabs.map((t) => (
          <button key={t.v} role="tab" aria-selected={filter === t.v} onClick={() => setFilter(t.v)}
            className={`rounded-full border px-4 py-2 text-sm font-bold transition ${filter === t.v ? "border-ink bg-ink text-bg" : "border-line bg-surface text-muted"}`}>
            {t.label}
          </button>
        ))}
      </div>
      {shown.length ? (
        <ol className="mt-4 grid gap-3">
          {shown.map((q) => (
            <li key={q.n} className="card grid gap-2 p-5">
              <p className="flex gap-2 text-[15px] leading-relaxed">
                {q.ok ? <CheckCircle size={22} weight="fill" className="shrink-0 text-ok" /> : <XCircle size={22} weight="fill" className="shrink-0 text-bad" />}
                <span><span className="mr-1 font-bold">{q.n}.</span>{q.prompt}</span>
              </p>
              <div className="ml-8 grid gap-1 text-sm">
                <p>Твой ответ: <span className={`font-bold ${q.ok ? "text-ok" : "text-bad"}`}>{q.given || "(нет ответа)"}</span></p>
                {!q.ok && <p>Правильный ответ: <span className="font-bold text-ok">{q.correct}</span></p>}
                <p className="text-muted">{q.why}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 text-muted">{filter === "wrong" ? "Здесь нет ошибок!" : "Здесь пока пусто."}</p>
      )}
    </section>
  );
}
