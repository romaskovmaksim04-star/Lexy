"use client";

import { Sparkle } from "@phosphor-icons/react";
import { setMotion, useCalm } from "@/lib/motion-pref";

/** Switch for page animations (the fire, floating mascot, entrances). Remembered per browser. */
export function MotionToggle({ className = "" }: { className?: string }) {
  const calm = useCalm();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!calm}
      onClick={() => setMotion(calm)}
      className={`inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold transition hover:border-fire ${className}`}
    >
      <Sparkle size={16} weight={calm ? "regular" : "fill"} className={calm ? "text-muted" : "text-fire-text"} />
      Анимации: {calm ? "выкл" : "вкл"}
    </button>
  );
}
