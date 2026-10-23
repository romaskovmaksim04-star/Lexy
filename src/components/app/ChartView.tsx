"use client";

import { useState } from "react";
import { Table, ChartLine } from "@phosphor-icons/react";
import type { Chart } from "@/lib/content/prompts";

// Task 1 visuals drawn as SVG. Series colours follow a fixed validated order; every
// series also gets its own marker shape and a direct label, so identity never rests
// on colour alone, and the same numbers are one tap away as a table.

const COLORS = ["var(--viz-1)", "var(--viz-2)", "var(--viz-3)", "var(--viz-4)"];
const W = 640;
const H = 340;
const PAD = { l: 52, r: 96, t: 16, b: 40 };

function niceMax(v: number) {
  const p = 10 ** Math.floor(Math.log10(v || 1));
  return Math.ceil(v / p / (v / p > 5 ? 2 : 1)) * p * (v / p > 5 ? 2 : 1);
}

function Marker({ i, x, y }: { i: number; x: number; y: number }) {
  const c = COLORS[i % 4];
  const ring = { stroke: "var(--surface)", strokeWidth: 2 };
  if (i % 4 === 1) return <rect x={x - 4.5} y={y - 4.5} width={9} height={9} rx={1.5} fill={c} {...ring} />;
  if (i % 4 === 2) return <path d={`M${x} ${y - 5.5}L${x + 5.5} ${y + 4.5}H${x - 5.5}Z`} fill={c} {...ring} />;
  if (i % 4 === 3) return <path d={`M${x} ${y - 6}L${x + 6} ${y}L${x} ${y + 6}L${x - 6} ${y}Z`} fill={c} {...ring} />;
  return <circle cx={x} cy={y} r={4.5} fill={c} {...ring} />;
}

function Legend({ names }: { names: string[] }) {
  if (names.length < 2) return null;
  return (
    <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
      {names.map((n, i) => (
        <li key={n} className="inline-flex items-center gap-1.5">
          <svg width="14" height="14" aria-hidden><Marker i={i} x={7} y={7} /></svg>{n}
        </li>
      ))}
    </ul>
  );
}

function XY({ chart }: { chart: Extract<Chart, { kind: "line" | "bar" }> }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(...chart.series.flatMap((s) => s.values)));
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const y = (v: number) => PAD.t + ih - (v / max) * ih;
  const n = chart.x.length;
  const band = iw / n;
  const xc = (i: number) => PAD.l + band * i + band / 2;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);

  return (
    <div className="relative">
      <Legend names={chart.series.map((s) => s.name)} />
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={chart.title} onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
            <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" fontSize="12" fill="var(--muted)">{t}</text>
          </g>
        ))}
        <text x={PAD.l} y={10} fontSize="11" fill="var(--muted)">{chart.unit}</text>
        {chart.x.map((label, i) => (
          <text key={label} x={xc(i)} y={H - 14} textAnchor="middle" fontSize="12" fill="var(--muted)">{label}</text>
        ))}

        {chart.kind === "bar" &&
          chart.series.map((s, si) => {
            const bw = Math.min(28, (band * 0.72) / chart.series.length - 2);
            const groupW = chart.series.length * (bw + 2) - 2;
            return s.values.map((v, i) => {
              const x = xc(i) - groupW / 2 + si * (bw + 2);
              const top = y(v);
              const h = PAD.t + ih - top;
              const r = Math.min(4, h);
              return (
                <path
                  key={`${s.name}-${i}`}
                  d={`M${x} ${PAD.t + ih}V${top + r}Q${x} ${top} ${x + r} ${top}H${x + bw - r}Q${x + bw} ${top} ${x + bw} ${top + r}V${PAD.t + ih}Z`}
                  fill={COLORS[si % 4]}
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
              );
            });
          })}

        {chart.kind === "line" &&
          chart.series.map((s, si) => (
            <g key={s.name}>
              <polyline fill="none" stroke={COLORS[si % 4]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"
                points={s.values.map((v, i) => `${xc(i)},${y(v)}`).join(" ")} />
              {s.values.map((v, i) => <Marker key={i} i={si} x={xc(i)} y={y(v)} />)}
              <text x={xc(n - 1) + 10} y={y(s.values[n - 1]) + 4} fontSize="12" fontWeight="600" fill="var(--ink)">{s.name}</text>
            </g>
          ))}

        {hover !== null && chart.kind === "line" && <line x1={xc(hover)} x2={xc(hover)} y1={PAD.t} y2={PAD.t + ih} stroke="var(--muted)" strokeDasharray="3 3" />}
        {chart.x.map((_, i) => (
          <rect key={i} x={PAD.l + band * i} y={PAD.t} width={band} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} />
        ))}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute right-2 top-8 rounded-2xl border border-line bg-surface px-3 py-2 text-[13px] shadow-lg">
          <p className="font-bold">{chart.x[hover]}</p>
          {chart.series.map((s, si) => (
            <p key={s.name} className="flex items-center gap-1.5 text-muted">
              <svg width="12" height="12" aria-hidden><Marker i={si} x={6} y={6} /></svg>
              {s.name}: <span className="font-semibold text-ink">{s.values[hover]}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function Pies({ chart }: { chart: Extract<Chart, { kind: "pie" }> }) {
  const labels = [...new Set(chart.pies.flatMap((p) => p.slices.map((s) => s.label)))];
  return (
    <div>
      <Legend names={labels} />
      <div className="grid gap-4 sm:grid-cols-2">
        {chart.pies.map((p) => {
          const total = p.slices.reduce((a, s) => a + s.value, 0);
          let acc = 0;
          return (
            <figure key={p.title} className="text-center">
              <svg viewBox="0 0 220 220" className="mx-auto w-full max-w-[240px]" role="img" aria-label={p.title}>
                {p.slices.map((s) => {
                  const a0 = (acc / total) * Math.PI * 2 - Math.PI / 2;
                  acc += s.value;
                  const a1 = (acc / total) * Math.PI * 2 - Math.PI / 2;
                  const big = a1 - a0 > Math.PI ? 1 : 0;
                  const R = 96;
                  const r = 54;
                  const pt = (rad: number, a: number) => `${110 + rad * Math.cos(a)} ${110 + rad * Math.sin(a)}`;
                  const mid = (a0 + a1) / 2;
                  const ci = labels.indexOf(s.label);
                  return (
                    <g key={s.label}>
                      <path d={`M${pt(R, a0)}A${R} ${R} 0 ${big} 1 ${pt(R, a1)}L${pt(r, a1)}A${r} ${r} 0 ${big} 0 ${pt(r, a0)}Z`} fill={COLORS[ci % 4]} stroke="var(--surface)" strokeWidth={2} />
                      {s.value / total > 0.06 && (
                        <text x={110 + 75 * Math.cos(mid)} y={110 + 75 * Math.sin(mid) + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill={ci % 4 < 2 ? "#fff" : "#1b1433"}>{Math.round((s.value / total) * 100)}%</text>
                      )}
                    </g>
                  );
                })}
              </svg>
              <figcaption className="mt-1 text-sm font-semibold">{p.title}</figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}

function DataTable({ chart }: { chart: Chart }) {
  let head: string[] = [];
  let rows: (string | number)[][] = [];
  if (chart.kind === "table") { head = chart.columns; rows = chart.rows; }
  else if (chart.kind === "pie") {
    const labels = [...new Set(chart.pies.flatMap((p) => p.slices.map((s) => s.label)))];
    head = ["", ...chart.pies.map((p) => p.title)];
    rows = labels.map((l) => [l, ...chart.pies.map((p) => `${p.slices.find((s) => s.label === l)?.value ?? 0}${chart.unit}`)]);
  } else {
    head = ["", ...chart.x];
    rows = chart.series.map((s) => [s.name, ...s.values]);
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead><tr>{head.map((h, i) => <th key={i} className="border-b border-line px-3 py-2 font-semibold text-muted">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={`px-3 py-2 ${j === 0 ? "font-semibold" : "tabular-nums"}`}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function ChartView({ chart }: { chart: Chart }) {
  const [table, setTable] = useState(chart.kind === "table");
  return (
    <figure>
      <div className="mb-3 flex items-start justify-between gap-3">
        <figcaption className="text-[15px] font-bold leading-snug">{chart.title}</figcaption>
        {chart.kind !== "table" && (
          <button onClick={() => setTable((t) => !t)} className="btn btn-ghost btn-sm shrink-0" aria-pressed={table}>
            {table ? <ChartLine size={16} /> : <Table size={16} />} {table ? "График" : "Таблица"}
          </button>
        )}
      </div>
      {table ? <DataTable chart={chart} /> : chart.kind === "pie" ? <Pies chart={chart} /> : chart.kind === "table" ? null : <XY chart={chart} />}
    </figure>
  );
}
