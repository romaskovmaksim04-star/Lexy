"use client";

import { useCalm } from "@/lib/motion-pref";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationControls, useMotionValue, useSpring } from "motion/react";
import { kickEmbers } from "./EmberSky";

// The flame from the hero: its eyes follow the cursor, it blinks, and a tap makes it
// jump and throw sparks into the background, saying something encouraging.

const LINES = [
  "Ещё разок!",
  "Горячо! Давай к Speaking?",
  "I'm on fire today.",
  "Пробник ждёт тебя",
  "Band 7? Легко.",
  "Тренируемся каждый день?",
  "Ай, щекотно!",
];

export type Mood = "calm" | "happy" | "worried";

export function LiveMascot({ className = "", mood = "calm", sayOnTap = true }: { className?: string; mood?: Mood; sayOnTap?: boolean }) {
  const id = useId();
  const ref = useRef<SVGSVGElement>(null);
  const reduce = useCalm();
  const controls = useAnimationControls();
  const [line, setLine] = useState<string | null>(null);
  const taps = useRef(0);
  const ex = useMotionValue(0);
  const ey = useMotionValue(0);
  const px = useSpring(ex, { stiffness: 220, damping: 18 });
  const py = useSpring(ey, { stiffness: 220, damping: 18 });

  useEffect(() => {
    if (reduce) return;
    const move = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height * 0.66);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 260);
      ex.set((dx / d) * 5 * k);
      ey.set((dy / d) * 3.2 * k);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [ex, ey, reduce]);

  useEffect(() => {
    if (!line) return;
    const t = setTimeout(() => setLine(null), 2200);
    return () => clearTimeout(t);
  }, [line]);

  const tap = () => {
    kickEmbers(1.3);
    taps.current += 1;
    if (sayOnTap) setLine(LINES[(taps.current - 1) % LINES.length]);
    if (!reduce) {
      controls.start({
        scaleY: [1, 0.82, 1.12, 0.97, 1],
        scaleX: [1, 1.12, 0.92, 1.02, 1],
        y: [0, 8, -26, 0, 0],
        transition: { duration: 0.75, times: [0, 0.18, 0.45, 0.75, 1], ease: "easeOut" },
      });
    }
  };

  const top = mood === "worried" ? "#9c8fb8" : "#FF9A0A";
  const bottom = mood === "worried" ? "#6f6390" : "#FF4E1A";

  return (
    <div className={`relative select-none ${className}`}>
      <AnimatePresence>
        {line && (
          <motion.p
            key={line + taps.current}
            initial={{ opacity: 0, y: reduce ? 0 : 10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduce ? 0 : -6 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-surface px-4 py-2 text-sm font-bold shadow-lg"
            role="status"
          >
            {line}
          </motion.p>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        onClick={tap}
        animate={controls}
        whileHover={reduce ? undefined : { scale: 1.03 }}
        whileTap={reduce ? undefined : { scale: 0.96 }}
        style={{ originY: 1 }}
        className="block w-full cursor-pointer rounded-[40%] focus-visible:outline-offset-8"
        aria-label="Огонёк Лекси. Нажми на него"
      >
        <svg ref={ref} viewBox="0 -25 100 145" className="w-full overflow-visible drop-shadow-[0_30px_40px_rgba(255,90,31,0.35)]" aria-hidden>
          <defs>
            <linearGradient id={`${id}f`} x1="0.2" y1="1" x2="0.8" y2="0">
              <stop offset="0" stopColor={bottom} />
              <stop offset="1" stopColor={top} />
            </linearGradient>
            <radialGradient id={`${id}g`} cx="0.42" cy="0.38" r="0.6">
              <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g className={reduce ? undefined : "flicker"}>
            <path fill={`url(#${id}f)`} d="M48-20C58-4 68 12 70 30C73 24 77 20 80 16C82 28 84 38 86 52C89 60 90 70 90 80C90 101 72 116 50 116C28 116 10 101 10 80C10 64 17 54 24 46C22 40 21 36 22 30C26 36 29 40 32 42C38 28 46 10 48-20z" />
            <path fill={`url(#${id}g)`} d="M48-20C58-4 68 12 70 30C73 24 77 20 80 16C82 28 84 38 86 52C89 60 90 70 90 80C90 101 72 116 50 116C28 116 10 101 10 80C10 64 17 54 24 46C22 40 21 36 22 30C26 36 29 40 32 42C38 28 46 10 48-20z" opacity="0.6" />
          </g>
          <rect x="17" y="59" width="66" height="37" rx="18.5" fill="#fff" />
          <motion.g style={{ x: px, y: py }}>
            <ellipse className="blink" cx="34" cy="76" rx="4" ry="6" fill="#151515" />
            <ellipse className="blink" cx="66" cy="76" rx="4" ry="6" fill="#151515" />
            <circle cx="35.4" cy="73.6" r="1.3" fill="#fff" />
            <circle cx="67.4" cy="73.6" r="1.3" fill="#fff" />
          </motion.g>
          {mood === "worried" ? (
            <path d="M44 87c3-3 9-3 12 0" stroke="#151515" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          ) : (
            <path d={mood === "happy" ? "M42 75h16c-.6 7.5-5 12-8 12s-7.4-4.5-8-12z" : "M43.5 76h13c-.5 6-4 10-6.5 10s-6-4-6.5-10z"} fill="#151515" />
          )}
        </svg>
      </motion.button>
    </div>
  );
}
