"use client";

import { useEffect } from "react";
import { isCalm } from "@/lib/motion-pref";

// Page-wide touch of life, mounted once in the root layout:
//  * cards with .heat get a warm spot that follows the cursor inside them;
//  * cards with .tilt lean towards the cursor in 3D while it is over them;
//  * buttons (.btn) ripple where they are pressed; fire buttons throw sparks when clicked.
// Everything is skipped when animations are switched off on the site.

type Spark = { x: number; y: number; vx: number; vy: number; life: number; size: number; hue: number };

export function Interactions() {
  useEffect(() => {
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const P = { x: -9999, y: -9999, moved: 0 };
    let raf = 0;

    // ---- warm spot and tilt -------------------------------------------------
    let tilted: HTMLElement | null = null;
    const light = (now: number) => {
      raf = 0;
      if (isCalm() || now - P.moved > 1500) return;
      const vh = innerHeight;
      document.querySelectorAll<HTMLElement>(".heat").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -50 || r.top > vh + 50) return;
        const inside = P.x >= r.left && P.x <= r.right && P.y >= r.top && P.y <= r.bottom;
        el.style.setProperty("--mx", `${(P.x - r.left).toFixed(0)}px`);
        el.style.setProperty("--my", `${(P.y - r.top).toFixed(0)}px`);
        el.style.setProperty("--hot", inside ? "1" : "0");
      });
      const over = (document.elementFromPoint(P.x, P.y) as HTMLElement | null)?.closest<HTMLElement>(".tilt") ?? null;
      if (tilted && tilted !== over) { tilted.style.transform = ""; tilted = null; }
      if (over) {
        const r = over.getBoundingClientRect();
        const nx = (P.x - r.left) / r.width - 0.5;
        const ny = (P.y - r.top) / r.height - 0.5;
        over.style.transform = `perspective(1100px) rotateX(${(-ny * 5).toFixed(2)}deg) rotateY(${(nx * 6).toFixed(2)}deg) translateY(-2px)`;
        tilted = over;
      }
    };
    const move = (e: PointerEvent) => {
      P.x = e.clientX;
      P.y = e.clientY;
      P.moved = performance.now();
      if (!raf) raf = requestAnimationFrame(light);
    };
    if (fine) addEventListener("pointermove", move, { passive: true });

    // ---- sparks from clicked buttons ----------------------------------------
    const cv = document.createElement("canvas");
    cv.setAttribute("aria-hidden", "true");
    Object.assign(cv.style, { position: "fixed", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "70" });
    document.body.appendChild(cv);
    const ctx = cv.getContext("2d");
    const dpr = Math.min(2, devicePixelRatio || 1);
    const size = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; };
    size();
    addEventListener("resize", size, { passive: true });
    let sparks: Spark[] = [];
    let sraf = 0;
    let last = 0;
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      sparks = sparks.filter((s) => (s.life -= dt) > 0);
      for (const s of sparks) {
        s.vy += 520 * dt;
        s.vx *= 0.985;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        const a = Math.min(1, s.life * 2.4);
        ctx.fillStyle = `hsla(${s.hue}, 100%, ${58 + s.size * 4}%, ${a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * (0.6 + a * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }
      sraf = sparks.length ? requestAnimationFrame(draw) : 0;
      if (!sparks.length) ctx.clearRect(0, 0, innerWidth, innerHeight);
    };
    const burst = (x: number, y: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
        const v = 180 + Math.random() * 260;
        sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.55 + Math.random() * 0.45, size: 1.6 + Math.random() * 2.2, hue: 14 + Math.random() * 26 });
      }
      if (!sraf) { last = performance.now(); sraf = requestAnimationFrame(draw); }
    };

    // ---- ripple where a button is pressed -----------------------------------
    const down = (e: PointerEvent) => {
      if (isCalm()) return;
      const b = (e.target as HTMLElement | null)?.closest?.<HTMLElement>(".btn");
      if (!b || (b as HTMLButtonElement).disabled) return;
      const r = b.getBoundingClientRect();
      const s = document.createElement("span");
      s.className = "ripple";
      s.style.left = `${e.clientX - r.left}px`;
      s.style.top = `${e.clientY - r.top}px`;
      s.style.setProperty("--rs", (Math.hypot(r.width, r.height) / 6).toFixed(1));
      b.appendChild(s);
      setTimeout(() => s.remove(), 900);
    };
    const click = (e: MouseEvent) => {
      if (isCalm()) return;
      const b = (e.target as HTMLElement | null)?.closest?.<HTMLElement>(".btn-fire");
      if (!b) return;
      const r = b.getBoundingClientRect();
      burst(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2, 10);
    };
    addEventListener("pointerdown", down, { passive: true });
    addEventListener("click", click, true);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(sraf);
      removeEventListener("pointermove", move);
      removeEventListener("pointerdown", down);
      removeEventListener("click", click, true);
      removeEventListener("resize", size);
      if (tilted) tilted.style.transform = "";
      cv.remove();
    };
  }, []);
  return null;
}
