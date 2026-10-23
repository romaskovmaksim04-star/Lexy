import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { DRILLS } from "@/lib/grammar";

// The one marquee on the landing: real corrections from the checker, drifting by.
// The list is rendered twice in one track that moves by half its width, so it loops seamlessly.
const PICK = ["am-agree", "since-years", "make-photo", "dont-3rd", "people-is", "explain-me", "depend-of", "a-advice", "if-will", "more-er", "did-past", "enjoy-to", "on-my-opinion", "interested-on"];

export function MistakeTicker() {
  const items = PICK.map((k) => DRILLS[k]).filter(Boolean);
  return (
    <section aria-label="Типичные ошибки и их исправления" className="marquee overflow-hidden py-6">
      <ul className="marquee-track">
        {[0, 1].flatMap((copy) =>
          items.map((d, i) => (
            <li key={`${copy}-${i}`} aria-hidden={copy === 1 || undefined} className="flex shrink-0 items-center gap-2.5 rounded-full border border-line bg-surface px-5 py-3 text-[15px] shadow-[0_10px_30px_-22px_rgb(var(--shadow)/0.5)]">
              <span className="text-muted line-through decoration-bad/70 decoration-2">{d.wrong}</span>
              <ArrowRight size={14} weight="bold" className="text-fire-text" />
              <span className="font-semibold">{d.right}</span>
            </li>
          )),
        )}
      </ul>
    </section>
  );
}
