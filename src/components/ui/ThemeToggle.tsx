"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    // Follow the system while the user has not picked a theme
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      let saved: string | null = null;
      try { saved = localStorage.getItem("lexy-theme"); } catch {}
      if (saved) return;
      const t = mq.matches ? "dark" : "light";
      document.documentElement.dataset.theme = t;
      setTheme(t);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const flip = () => {
    const t = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("lexy-theme", t); } catch {}
    setTheme(t);
  };

  return (
    <button
      type="button"
      onClick={flip}
      aria-label={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
      className={`grid size-10 place-items-center rounded-full text-ink transition hover:bg-surface-2 ${className}`}
    >
      {theme === "dark" ? <Sun size={20} weight="bold" /> : <Moon size={20} weight="bold" />}
    </button>
  );
}
