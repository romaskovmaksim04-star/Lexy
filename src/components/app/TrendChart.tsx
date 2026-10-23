"use client";

import { useState } from "react";

// Band over attempts for each section. Fixed series order (validated palette), one
// marker shape per series, a legend and direct end labels, a dashed target line.

type Series = { section: string; label: string; points: { at: string; band: number }[] };

const COLORS = ["var(--viz-1)", "var(--viz-2)", "var(--viz-3)", "var(--viz-4)"];
const W = 640;
const H = 260;
const PAD = { l: 36, r: 84, t: 16, b: 28 };

function Mark({ i, x, y }: { i: number; x: number; y: number }) {
  const c = COLORS[i % 4];
  const ring = { stroke: "var(--surface)", strokeWidth: 2 };
  if (i === 1) return <rect x={x - 4.5} y={y - 4.5} width={9} height={9} rx={1.5} fill={c} {...ring} />;
  if (i === 2) return <path d={`M${x} ${y - 5.5}L${x + 5.5} ${y + 4.5}H${x - 5.5}Z`} fill={c} {...ring} />;
  if (i === 3) return <path d={`M${x} ${y - 6}L${x + 6} ${y}L${x} ${y + 6}L${x - 6} ${y}Z`} fill={c} {...ring} />;
  return <circle cx={x} cy={y} r={4.5} fill={c} {...ring} />;
}

export function TrendChart({ series, target }: { series: Series[]; target: number }) {
  const [hover, setHover] = useState<{ s: number; p: number } | null>(null);
  const present = series.map((s, i) => ({ ...s, i })).filter((s) => s.points.length);
  if (!present.length) return <p className="py-10 text-center text-muted">Баллы появятся после первых тестов.</p>;
  const n = Math.max(...present.map((s) => s.points.length));
  const lo = 3;
  const hi = 9;
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const x = (k: number) => PAD.l + (n === 1 ? iw / 2 : (k / (n - 1)) * iw);
  const y = (b: number) => PAD.t + ih - ((b - lo) / (hi - lo)) * ih;

  return (
    <div className="relative">
      <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
        {present.map((s) => (
          <li key={s.section} className="inline-flex items-center gap-1.5"><svg width="14" height="14" aria-hidden><Mark i={s.i} x={7} y={7} /></svg>{s.label}</li>
        ))}
        <li className="inline-flex items-center gap-1.5"><svg width="18" height="6" aria-hidden><line x1="0" x2="18" y1="3" y2="3" stroke="var(--ink)" strokeDasharray="4 3" strokeWidth="1.5" /></svg>цель {target.toFixed(1)}</li>
      </ul>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Динамика баллов по секциям" onMouseLeave={() => setHover(null)}>
        {[4, 5, 6, 7, 8, 9].map((b) => (
          <g key={b}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(b)} y2={y(b)} stroke="var(--line)" />
            <text x={PAD.l - 8} y={y(b) + 4} textAnchor="end" fontSize="12" fill="var(--muted)">{b}</text>
          </g>
        ))}
        <line x1={PAD.l} x2={W - PAD.r} y1={y(target)} y2={y(target)} stroke="var(--ink)" strokeDasharray="5 4" strokeWidth={1.5} opacity={0.7} />
        {present.map((s) => {
          const offset = n - s.points.length; // align the latest attempts on the right
          return (
            <g key={s.section}>
              {s.points.length > 1 && (
                <polyline fill="none" stroke={COLORS[s.i % 4]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"
                  points={s.points.map((p, k) => `${x(k + offset)},${y(p.band)}`).join(" ")} />
              )}
              {s.points.map((p, k) => (
                <g key={k} onMouseEnter={() => setHover({ s: s.i, p: k })} onClick={() => setHover({ s: s.i, p: k })}>
                  <circle cx={x(k + offset)} cy={y(p.band)} r={12} fill="transparent" />
                  <Mark i={s.i} x={x(k + offset)} y={y(p.band)} />
                </g>
              ))}
              <text x={x(n - 1) + 10} y={y(s.points[s.points.length - 1].band) + 4} fontSize="12" fontWeight="600" fill="var(--ink)">{s.label}</text>
            </g>
          );
        })}
      </svg>
      {hover && (() => {
        const s = series[hover.s];
        const p = s.points[hover.p];
        return (
          <div className="pointer-events-none absolute right-2 top-8 rounded-2xl border border-line bg-surface px-3 py-2 text-[13px] shadow-lg">
            <p className="font-bold">{s.label}: {p.band.toFixed(1)}</p>
            <p className="text-muted">{new Date(p.at).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}</p>
          </div>
        );
      })()}
    </div>
  );
}

export function ActivityGrid({ days }: { days: { day: string; count: number }[] }) {
  const weeks: { day: string; count: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  const level = (c: number) => (c === 0 ? 0 : c === 1 ? 1 : c <= 3 ? 2 : 3);
  const fill = ["var(--surface-2)", "color-mix(in oklab, var(--fire) 35%, var(--surface))", "color-mix(in oklab, var(--fire) 65%, var(--surface))", "var(--fire)"];
  return (
    <div>
      <div className="no-scrollbar flex gap-1 overflow-x-auto" role="img" aria-label="Активность за последние недели">
        {weeks.map((w, i) => (
          <div key={i} className="grid shrink-0 gap-1">
            {w.map((d) => (
              <span key={d.day} className="size-3.5 rounded-[4px] sm:size-4" style={{ background: fill[level(d.count)] }}
                title={`${new Date(d.day).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}: ${d.count ? `занятий ${d.count}` : "без занятий"}`} />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
        Меньше {fill.map((f, i) => <span key={i} className="size-3 rounded-[3px]" style={{ background: f }} />)} Больше
      </div>
    </div>
  );
}
