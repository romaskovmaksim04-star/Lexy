"use client";

import { useEffect, useRef } from "react";

// A large statement whose words light up as it scrolls through the screen; key words
// turn fire-coloured. Words are split once on mount; scroll work is a single rAF read.

type Part = { text: string; key?: boolean };

export function Manifest({ parts }: { parts: Part[] }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const p = ref.current;
    if (!p) return;
    const words = Array.from(p.querySelectorAll<HTMLSpanElement>(".mw"));
    let last = -1;
    let raf = 0;
    const update = () => {
      raf = 0;
      if (document.documentElement.dataset.motion === "off") {
        words.forEach((w) => w.classList.add("lit"));
        return;
      }
      const r = p.getBoundingClientRect();
      const vh = innerHeight;
      if (r.bottom < -100 || r.top > vh + 100) return;
      const k = Math.max(0, Math.min(1, (vh * 0.78 - r.top) / (r.height + vh * 0.25)));
      const n = Math.round(k * words.length);
      if (n === last) return;
      last = n;
      words.forEach((w, i) => w.classList.toggle("lit", i < n));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    // IntersectionObserver gates the work: the scroll handler runs only while the text is on screen
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { addEventListener("scroll", onScroll, { passive: true }); update(); }
      else removeEventListener("scroll", onScroll);
    }, { rootMargin: "100px" });
    io.observe(p);
    return () => { io.disconnect(); removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <p ref={ref} className="display mx-auto max-w-[22ch] text-center text-[30px] font-bold leading-[1.15] sm:text-5xl lg:text-[64px]">
      {parts.map((p, pi) =>
        p.text.split(/(\s+)/).map((w, wi) =>
          /^\s+$/.test(w) || !w ? (w ? " " : null) : <span key={`${pi}-${wi}`} className={`mw${p.key ? " key" : ""}`}>{w}</span>,
        ),
      )}
    </p>
  );
}
