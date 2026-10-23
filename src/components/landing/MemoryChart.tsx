"use client";

import { useMemo, useRef, useState } from "react";

// Illustrative model of the forgetting curve (Ebbinghaus): R = e^(-t/S).
// Without review S stays small; each spaced review resets recall and makes S longer.
const DAYS = 14;
const REVIEWS = [1, 3, 7];

function retention(day: number, withReviews: boolean): number {
  if (!withReviews) return Math.exp(-day / 1.1);
  let s = 1.1;
  let last = 0;
  for (const r of REVIEWS) {
    if (day >= r) { last = r; s *= 2.6; }
  }
  return Math.exp(-(day - last) / s);
}

const W = 640, H = 300, PAD = { l: 44, r: 112, t: 16, b: 36 };
const x = (d: number) => PAD.l + (d / DAYS) * (W - PAD.l - PAD.r);
const y = (r: number) => PAD.t + (1 - r) * (H - PAD.t - PAD.b);

function path(withReviews: boolean) {
  const pts: string[] = [];
  for (let i = 0; i <= DAYS * 20; i++) {
    const d = i / 20;
    // Vertical jump at a review day
    if (withReviews && REVIEWS.some((r) => Math.abs(d - r) < 1e-9)) pts.push(`L${x(d)},${y(retention(d - 0.0001, true))}`);
    pts.push(`${pts.length ? "L" : "M"}${x(d).toFixed(1)},${y(retention(d, withReviews)).toFixed(1)}`);
  }
  return pts.join(" ");
}

export function MemoryChart() {
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const paths = useMemo(() => ({ plain: path(false), spaced: path(true) }), []);

  const onMove = (e: React.PointerEvent) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    const px = ((e.clientX - box.left) / box.width) * W;
    const d = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * DAYS);
    setHover(d >= 0 && d <= DAYS ? d : null);
  };

  const pct = (v: number) => `${Math.round(v * 100)}%`;
  const end = { plain: retention(DAYS, false), spaced: retention(DAYS, true) };

  return (
    <figure className="w-full">
      <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted" aria-hidden>
        <span className="inline-flex items-center gap-2"><span className="h-0.5 w-5 rounded-full" style={{ background: "var(--chart-1)" }} />С повторами в GoLexi</span>
        <span className="inline-flex items-center gap-2"><span className="h-0.5 w-5 rounded-full" style={{ background: "var(--chart-2)" }} />Прочитал один раз</span>
      </div>
      <div className="relative">
        <svg
          ref={ref}
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full touch-none select-none"
          role="img"
          aria-label="Сколько слов помнишь через 14 дней: с повторами около 70 процентов, без повторов почти ноль"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          {[0, 0.5, 1].map((r) => (
            <g key={r}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(r)} y2={y(r)} stroke="var(--line)" strokeWidth="1" />
              <text x={PAD.l - 10} y={y(r) + 4} textAnchor="end" fontSize="12" fill="var(--muted)">{pct(r)}</text>
            </g>
          ))}
          {[0, 1, 3, 7, 14].map((d) => (
            <text key={d} x={x(d)} y={H - 12} textAnchor="middle" fontSize="12" fill="var(--muted)">{d === 0 ? "день 0" : d}</text>
          ))}
          <path d={paths.plain} fill="none" stroke="var(--chart-2)" strokeWidth="2" strokeLinejoin="round" />
          <path d={paths.spaced} fill="none" stroke="var(--chart-1)" strokeWidth="2" strokeLinejoin="round" />
          {REVIEWS.map((r) => (
            <circle key={r} cx={x(r)} cy={y(1)} r="4.5" fill="var(--chart-1)" stroke="var(--surface)" strokeWidth="2" />
          ))}
          <text x={x(DAYS) + 10} y={y(end.spaced) + 4} fontSize="13" fontWeight="600" fill="var(--ink)">{pct(end.spaced)}</text>
          <text x={x(DAYS) + 10} y={y(end.plain) + 4} fontSize="13" fontWeight="600" fill="var(--ink)">{pct(end.plain)}</text>
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="var(--muted)" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx={x(hover)} cy={y(retention(hover, true))} r="5" fill="var(--chart-1)" stroke="var(--surface)" strokeWidth="2" />
              <circle cx={x(hover)} cy={y(retention(hover, false))} r="5" fill="var(--chart-2)" stroke="var(--surface)" strokeWidth="2" />
            </g>
          )}
        </svg>
        {hover !== null && (
          <div
            className="pointer-events-none absolute top-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-lg"
            style={{ left: `${(x(hover) / W) * 100}%`, transform: hover > DAYS / 2 ? "translateX(calc(-100% - 12px))" : "translateX(12px)" }}
          >
            <p className="font-semibold text-ink">День {hover}</p>
            <p className="text-muted">С повторами: <span className="font-semibold text-ink">{pct(retention(hover, true))}</span></p>
            <p className="text-muted">Без повторов: <span className="font-semibold text-ink">{pct(retention(hover, false))}</span></p>
          </div>
        )}
      </div>
      <table className="sr-only">
        <caption>Доля запомненного по дням</caption>
        <thead><tr><th>День</th><th>С повторами</th><th>Без повторов</th></tr></thead>
        <tbody>
          {[0, 1, 3, 7, 14].map((d) => (
            <tr key={d}><td>{d}</td><td>{pct(retention(d, true))}</td><td>{pct(retention(d, false))}</td></tr>
          ))}
        </tbody>
      </table>
      <figcaption className="mt-3 text-xs text-muted">Модель по кривой забывания Эббингауза, точки: повторения на 1, 3 и 7 день. Иллюстрация, а не замер.</figcaption>
    </figure>
  );
}
