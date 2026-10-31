import { useId } from "react";

// Lexy's mascot: the same living flame as the hero, as a small flat SVG.
export function Mascot({ className, animated = false, title = "Лекси" }: { className?: string; animated?: boolean; title?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 -25 100 145" role="img" aria-label={title} className={className}>
      <defs>
        <linearGradient id={`${id}f`} x1="0.2" y1="1" x2="0.8" y2="0">
          <stop offset="0" stopColor="#FF4E1A" />
          <stop offset="1" stopColor="#FF9A0A" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${id}f)`}
        d="M48-20C58-4 68 12 70 30C73 24 77 20 80 16C82 28 84 38 86 52C89 60 90 70 90 80C90 101 72 116 50 116C28 116 10 101 10 80C10 64 17 54 24 46C22 40 21 36 22 30C26 36 29 40 32 42C38 28 46 10 48-20z"
      />
      <rect x="17" y="59" width="66" height="37" rx="18.5" fill="#fff" />
      <ellipse className={animated ? "blink" : undefined} cx="34" cy="76" rx="4" ry="6" fill="#151515" />
      <ellipse className={animated ? "blink" : undefined} cx="66" cy="76" rx="4" ry="6" fill="#151515" />
      <path d="M43.5 76h13c-.5 6-4 10-6.5 10s-6-4-6.5-10z" fill="#151515" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Mascot className="h-8 w-auto" title="" />
      <span className="display text-[22px] font-extrabold leading-none tracking-[-0.05em]">LexiUp</span>
    </span>
  );
}
