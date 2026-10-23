"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Timer, X } from "@phosphor-icons/react";

/** Sticky header of a running test: exit, title, countdown, progress and the submit button. */
export function TestBar({
  title, minutes, answered, total, onSubmit, submitting, submitLabel = "Завершить",
}: { title: string; minutes: number; answered?: number; total?: number; onSubmit: () => void; submitting?: boolean; submitLabel?: string }) {
  const [left, setLeft] = useState(minutes * 60);
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, []);
  const m = Math.floor(Math.abs(left) / 60);
  const s = String(Math.abs(left) % 60).padStart(2, "0");
  const late = left < 0;
  return (
    <div className="sticky top-16 z-20 -mx-4 mb-6 flex items-center gap-2 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur-xl md:-mx-8 md:px-8 lg:top-0">
      <Link href="/app/tests" className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-surface-2" aria-label="Выйти из теста">
        <X size={20} />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{title}</p>
        {total !== undefined && <p className="whitespace-nowrap text-xs text-muted"><span className="max-sm:hidden">Отвечено </span>{answered} из {total}</p>}
      </div>
      <span className={`inline-flex items-center gap-1.5 shrink-0 rounded-full px-2.5 py-1.5 text-sm font-bold tabular-nums sm:px-3 ${late ? "bg-bad-soft text-bad" : "bg-surface-2"}`} aria-label="Осталось времени">
        <Timer size={16} weight="bold" className="max-sm:hidden" /> {late ? "-" : ""}{m}:{s}
      </span>
      <button onClick={onSubmit} disabled={submitting} className="btn btn-fire btn-sm shrink-0">{submitting ? "Проверяем…" : submitLabel}</button>
    </div>
  );
}
