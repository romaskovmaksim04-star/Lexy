"use client";

import { useState } from "react";
import { bandFromRaw, formatBand, overallBand } from "@/lib/band";

type Mode = "band" | "raw";
const SECTIONS = [
  { key: "listening", label: "Listening" },
  { key: "reading", label: "Reading" },
  { key: "writing", label: "Writing" },
  { key: "speaking", label: "Speaking" },
] as const;
type Key = (typeof SECTIONS)[number]["key"];

const BAND_STEPS = Array.from({ length: 19 }, (_, i) => i * 0.5);

export function BandCalculator({ compact = false }: { compact?: boolean }) {
  const [mode, setMode] = useState<Mode>("band");
  const [format, setFormat] = useState<"academic" | "general">("academic");
  const [bands, setBands] = useState<Record<Key, number>>({ listening: 7, reading: 6.5, writing: 6, speaking: 6.5 });
  const [raw, setRaw] = useState({ listening: 30, reading: 28 });

  const value = (k: Key) =>
    mode === "raw" && (k === "listening" || k === "reading") ? bandFromRaw(k, raw[k], format) : bands[k];
  const overall = overallBand([value("listening"), value("reading"), value("writing"), value("speaking")]);

  return (
    <div className={`grid gap-8 ${compact ? "" : "lg:grid-cols-[1.3fr_1fr]"} items-center`}>
      <div className="grid gap-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Режим">
          {([["band", "Знаю баллы"], ["raw", "Знаю число верных ответов"]] as const).map(([m, label]) => (
            <button key={m} type="button" onClick={() => setMode(m)} aria-pressed={mode === m}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === m ? "bg-ink text-bg" : "border border-line bg-surface text-muted hover:text-ink"}`}>
              {label}
            </button>
          ))}
          {mode === "raw" && (
            <select value={format} onChange={(e) => setFormat(e.target.value as "academic" | "general")}
              className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold" aria-label="Формат Reading">
              <option value="academic">Academic</option>
              <option value="general">General Training</option>
            </select>
          )}
        </div>
        {SECTIONS.map((s) => {
          const isRaw = mode === "raw" && (s.key === "listening" || s.key === "reading");
          const id = `calc-${s.key}`;
          return (
            <div key={s.key} className="grid gap-2">
              <div className="flex items-baseline justify-between">
                <label htmlFor={id} className="label">{s.label}</label>
                <span className="display text-lg font-bold tabular-nums">
                  {isRaw ? <>{raw[s.key as "listening" | "reading"]}/40 <span className="text-muted">→ {formatBand(value(s.key))}</span></> : formatBand(bands[s.key])}
                </span>
              </div>
              {isRaw ? (
                <input id={id} type="range" min={0} max={40} step={1} value={raw[s.key as "listening" | "reading"]}
                  onChange={(e) => setRaw((r) => ({ ...r, [s.key]: Number(e.target.value) }))} className="accent-[var(--fire)]" />
              ) : (
                <input id={id} type="range" min={0} max={BAND_STEPS.length - 1} step={1} value={bands[s.key] * 2}
                  onChange={(e) => setBands((b) => ({ ...b, [s.key]: Number(e.target.value) / 2 }))} className="accent-[var(--fire)]" />
              )}
            </div>
          );
        })}
      </div>
      <div className="rounded-3xl bg-fire p-8 text-center text-[#1b1433]">
        <p className="text-sm font-bold">Overall band</p>
        <p className="display mt-2 text-7xl font-extrabold tabular-nums leading-none md:text-8xl" aria-live="polite">{formatBand(overall)}</p>
        <p className="mx-auto mt-4 max-w-[28ch] text-sm font-medium text-[#1b1433]/80">
          Среднее четырёх секций. Четверть балла округляется вверх: 6.25 даёт 6.5, 6.75 даёт 7.0.
        </p>
      </div>
    </div>
  );
}
