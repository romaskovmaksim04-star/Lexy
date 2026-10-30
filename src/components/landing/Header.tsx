"use client";

import { useCalm } from "@/lib/motion-pref";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { List, X } from "@phosphor-icons/react";
import { Logo } from "@/components/ui/Mascot";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const LINKS = [
  { href: "/games", label: "Игры" },
  { href: "/guides", label: "Гайды" },
  { href: "/#lexi", label: "Lexi" },
  { href: "/#platform", label: "Платформа" },
  { href: "/pricing", label: "Тарифы" },
  { href: "/guarantee", label: "Гарантия" },
  { href: "/#faq", label: "Вопросы" },
];

export function Header({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const reduce = useCalm();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // The menu is only reachable below lg; close it if the window grows past that.
  useEffect(() => {
    const mq = matchMedia("(min-width: 1024px)");
    const off = () => setOpen(false);
    mq.addEventListener("change", off);
    return () => mq.removeEventListener("change", off);
  }, []);

  const menu = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col bg-bg px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          initial={reduce ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "fixed" }}
        >
          <div className="flex h-16 shrink-0 items-center justify-between">
            <Logo />
            <button type="button" className="grid size-10 place-items-center rounded-full hover:bg-surface-2" aria-label="Закрыть меню" onClick={() => setOpen(false)}>
              <X size={22} weight="bold" />
            </button>
          </div>
          <nav className="mt-6 flex flex-col overflow-y-auto">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="display border-b border-line py-5 text-2xl font-bold">
                {l.label}
              </Link>
            ))}
            {!signedIn && (
              <Link href="/login" onClick={() => setOpen(false)} className="display border-b border-line py-5 text-2xl font-bold">Войти</Link>
            )}
          </nav>
          <Link href={signedIn ? "/app" : "/quiz"} className="btn btn-fire mt-auto w-full py-4 text-base" onClick={() => setOpen(false)}>
            {signedIn ? "Мой план" : "Начать подготовку"}
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 md:px-8">
        <Link href="/" aria-label="LexiUp, на главную"><Logo /></Link>
        <nav className="ml-6 hidden items-center gap-7 text-[15px] font-medium text-muted lg:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="transition hover:text-ink">{l.label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {signedIn ? (
            <Link href="/app" className="btn btn-fire btn-sm">Мой план</Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm hidden sm:inline-flex">Войти</Link>
              <Link href="/quiz" className="btn btn-fire btn-sm hidden uppercase tracking-wide sm:inline-flex">Открыть LexiUp</Link>
            </>
          )}
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full hover:bg-surface-2 lg:hidden"
            aria-label="Меню"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <List size={22} weight="bold" />
          </button>
        </div>
      </div>
      {/* Portalled to <body>: on some phones a fixed overlay inside a sticky,
          backdrop-filtered header mispositions and covers the whole page. */}
      {mounted && createPortal(menu, document.body)}
    </header>
  );
}
