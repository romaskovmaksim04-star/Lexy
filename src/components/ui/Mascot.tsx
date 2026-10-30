import { useId } from "react";

// Lexy's mascot: the flame from the first draft of the site.
export function Mascot({ className, animated = false, title = "Лекси" }: { className?: string; animated?: boolean; title?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 100 120" role="img" aria-label={title} className={className}>
      <defs>
        <linearGradient id={`${id}f`} x1="0.2" y1="1" x2="0.8" y2="0">
          <stop offset="0" stopColor="#FF4E1A" />
          <stop offset="1" stopColor="#FF9A0A" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${id}f)`}
        d="M42 3C54 6 66 15 70 28c2 7 1 14-2 21 5-1 8-7 8-14 7 5 12 14 12 25 7 8 10 18 10 28 0 17-20 28-46 28C21 117 2 105 2 87c0-17 12-31 26-41 10-8 16-17 14-43z"
      />
      <rect x="17" y="64" width="66" height="30" rx="15" fill="#fff" />
      <ellipse className={animated ? "blink" : undefined} cx="34" cy="79" rx="4" ry="6" fill="#151515" />
      <ellipse className={animated ? "blink" : undefined} cx="66" cy="79" rx="4" ry="6" fill="#151515" />
      <path d="M43.5 78h13c-.5 6-4 10-6.5 10s-6-4-6.5-10z" fill="#151515" />
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
