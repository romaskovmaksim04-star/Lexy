"use client";

import { useState, useTransition } from "react";
import { Check, Plus } from "@phosphor-icons/react";
import { addWord } from "@/app/actions";

export function AddWordButton({ term, meaning = "", example = "", source = "manual", label }: { term: string; meaning?: string; example?: string; source?: string; label?: string }) {
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={done || pending}
      onClick={() => start(async () => { const r = await addWord(term, meaning, example, source); if (r.ok) setDone(true); })}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${done ? "border-ok/30 bg-ok-soft text-ok" : "border-line bg-surface hover:border-fire hover:text-fire-text"}`}
    >
      {done ? <Check size={14} weight="bold" /> : <Plus size={14} weight="bold" />}
      {label ?? term}
    </button>
  );
}
