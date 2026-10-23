"use client";

import { useState } from "react";

type Mark = { index: number; length: number; fix: string; why: string; kind: string };

const TONE: Record<string, string> = {
  grammar: "decoration-bad",
  vocabulary: "decoration-[var(--viz-1)]",
  spelling: "decoration-[var(--viz-4)]",
  style: "decoration-muted",
};

/** The essay with every found mistake underlined; tapping one shows the fix. */
export function EssayMarkup({ text, marks }: { text: string; marks: Mark[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const parts: React.ReactNode[] = [];
  let pos = 0;
  marks
    .slice()
    .sort((a, b) => a.index - b.index)
    .forEach((m, i) => {
      if (m.index < pos) return;
      parts.push(text.slice(pos, m.index));
      const on = open === i;
      parts.push(
        <span key={i} className="relative">
          <button
            type="button"
            onClick={() => setOpen(on ? null : i)}
            aria-expanded={on}
            className={`underline decoration-wavy decoration-2 underline-offset-4 ${TONE[m.kind] ?? "decoration-bad"} ${on ? "rounded bg-fire-soft" : ""}`}
          >
            {text.slice(m.index, m.index + m.length)}
          </button>
          {on && (
            <span role="tooltip" className="absolute left-0 top-full z-20 mt-2 block w-72 rounded-2xl border border-line bg-surface p-3 text-left text-sm shadow-lg">
              <span className="block font-bold text-ok">{m.fix}</span>
              <span className="mt-1 block text-muted">{m.why}</span>
            </span>
          )}
        </span>,
      );
      pos = m.index + m.length;
    });
  parts.push(text.slice(pos));
  return <div className="whitespace-pre-line text-[16px] leading-[1.9]">{parts}</div>;
}
