"use client";

import { useCalm } from "@/lib/motion-pref";
import { useState } from "react";
import { motion } from "motion/react";
import { Gift } from "@phosphor-icons/react";
import { kickEmbers } from "@/components/landing/EmberSky";
import { spinWheel } from "@/app/actions";

// The discount wheel at the end of the quiz. The prize is a real discount on the first
// paid month; the server draws it and signs the result, the wheel only shows it.

const SEGMENTS = [10, 25, 15, 50, 20, 30]; // same order as lib/wheel.ts
const COLORS = ["var(--fire)", "var(--fire-soft)", "#ffb340", "var(--ink)", "var(--fire-soft)", "#ff8a4c"];
const TEXT = ["#1b1433", "#1b1433", "#1b1433", "#ffffff", "#1b1433", "#1b1433"];

export function Wheel({ onWin }: { onWin: (percent: number, token: string) => void }) {
  const reduce = useCalm();
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState<number | null>(null);
  const [token, setToken] = useState("");
  const seg = 360 / SEGMENTS.length;

  const spin = async () => {
    if (spinning || won !== null) return;
    setSpinning(true);
    let i = 0;
    try {
      const r = await spinWheel();
      i = r.index;
      setToken(r.token);
    } catch {
      setSpinning(false);
      return;
    }
    // The pointer is at the top; land in the middle of segment i after several turns
    const target = 360 * 6 + (360 - (i * seg + seg / 2));
    setAngle(target);
    setTimeout(() => {
      setSpinning(false);
      setWon(SEGMENTS[i]);
      kickEmbers(1.8);
    }, reduce ? 50 : 3600);
  };

  const r = 140;
  const slice = (i: number) => {
    const a0 = ((i * seg - 90) * Math.PI) / 180;
    const a1 = (((i + 1) * seg - 90) * Math.PI) / 180;
    return `M150 150L${150 + r * Math.cos(a0)} ${150 + r * Math.sin(a0)}A${r} ${r} 0 0 1 ${150 + r * Math.cos(a1)} ${150 + r * Math.sin(a1)}Z`;
  };

  return (
    <div className="grid justify-items-center gap-6 text-center">
      <div className="relative w-full max-w-[320px]">
        <svg viewBox="0 0 300 40" className="absolute -top-3 left-0 z-10 w-full" aria-hidden>
          <path d="M138 4h24l-12 26z" fill="var(--ink)" stroke="var(--surface)" strokeWidth="3" strokeLinejoin="round" />
        </svg>
        <motion.svg
          viewBox="0 0 300 300"
          className="w-full drop-shadow-[0_24px_40px_rgba(255,90,31,0.35)]"
          animate={{ rotate: angle }}
          transition={reduce ? { duration: 0 } : { duration: 3.5, ease: [0.12, 0.8, 0.18, 1] }}
          role="img"
          aria-label="Колесо со скидками"
        >
          <circle cx="150" cy="150" r="146" fill="var(--surface)" />
          {SEGMENTS.map((p, i) => {
            const mid = ((i + 0.5) * seg - 90) * (Math.PI / 180);
            return (
              <g key={i}>
                <path d={slice(i)} fill={COLORS[i]} stroke="var(--surface)" strokeWidth="3" />
                <text
                  x={150 + 92 * Math.cos(mid)}
                  y={150 + 92 * Math.sin(mid) + 8}
                  textAnchor="middle"
                  fontSize="24"
                  fontWeight="800"
                  fill={TEXT[i]}
                  transform={`rotate(${(i + 0.5) * seg} ${150 + 92 * Math.cos(mid)} ${150 + 92 * Math.sin(mid)})`}
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {p}%
                </text>
              </g>
            );
          })}
          <circle cx="150" cy="150" r="30" fill="var(--surface)" stroke="var(--line)" strokeWidth="2" />
        </motion.svg>
        <span className="pointer-events-none absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center text-fire-text"><Gift size={26} weight="fill" /></span>
      </div>

      {won === null ? (
        <button type="button" onClick={spin} disabled={spinning} className="btn btn-fire px-10 py-4 text-base">
          {spinning ? "Удачи…" : "Крутить"}
        </button>
      ) : (
        <div className="grid justify-items-center gap-3" role="status">
          <p className="display text-3xl font-extrabold">Скидка {won}%!</p>
          <p className="max-w-[34ch] text-muted">Она уже закреплена за твоим планом и применится к первому месяцу Pro или Pro+.</p>
          <button type="button" onClick={() => onWin(won, token)} className="btn btn-fire px-8 py-4 text-base">Забрать скидку</button>
        </div>
      )}
    </div>
  );
}
