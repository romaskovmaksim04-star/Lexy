// A headline whose letters float in one after another (CSS only, see .kin in globals.css).
// A part marked `mark` gets a hand-drawn marker line under it once its letters are in.
// Screen readers get the plain sentence; the per-letter spans are hidden from them.

type Part = { text: string; accent?: boolean; mark?: boolean };

export function KineticTitle({ parts, className = "", as: Tag = "h1" }: { parts: Part[]; className?: string; as?: "h1" | "h2" }) {
  let k = 0;
  const label = parts.map((p) => p.text).join("");
  return (
    <Tag className={`kin ${className}`} aria-label={label}>
      {parts.map((p, pi) => {
        const words = p.text.split(/(\s+)/).map((w, wi) =>
          /^\s+$/.test(w) || !w ? (
            w ? " " : null
          ) : (
            <span key={wi} className="wd">
              {[...w].map((c, ci) => (
                <span key={ci} className="ch" style={{ ["--k" as string]: k++ }}>{c}</span>
              ))}
            </span>
          ),
        );
        if (!p.mark) return <span key={pi} aria-hidden className={p.accent ? "text-fire-text" : undefined}>{words}</span>;
        // The line starts drawing right after the last letter of this part has landed
        const delay = `${(k * 22 + 250 + 500) / 1000}s`;
        return (
          <span key={pi} aria-hidden className={`relative inline-block lg:whitespace-nowrap ${p.accent ? "text-fire-text" : ""}`}>
            {words}
            <svg className="scribble pointer-events-none absolute -bottom-[0.14em] left-0 h-[0.32em] w-full overflow-visible" viewBox="0 0 300 24" preserveAspectRatio="none" style={{ ["--d" as string]: delay }}>
              <path d="M4 17 C 60 7, 120 5, 170 9 S 260 18, 296 8" fill="none" stroke="var(--fire-2)" strokeWidth="7" strokeLinecap="round" pathLength={1} opacity="0.85" />
            </svg>
          </span>
        );
      })}
    </Tag>
  );
}
