"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cards, ChartLineUp, ChatsCircle, Exam, House } from "@phosphor-icons/react";

const ITEMS = [
  { href: "/app", label: "Главная", icon: House, exact: true },
  { href: "/app/tests", label: "Тесты", icon: Exam, match: ["/app/tests", "/app/reading", "/app/listening", "/app/writing", "/app/speaking", "/app/results"] },
  { href: "/app/lexi", label: "Lexi", icon: ChatsCircle },
  { href: "/app/words", label: "Словарь", icon: Cards },
  { href: "/app/progress", label: "Прогресс", icon: ChartLineUp },
];

export function AppNav({ variant }: { variant: "side" | "bottom" }) {
  const path = usePathname();
  const active = (it: (typeof ITEMS)[number]) =>
    it.exact ? path === it.href : (it.match ?? [it.href]).some((p) => path.startsWith(p));

  if (variant === "side") {
    return (
      <nav className="mt-10 grid gap-1" aria-label="Основное меню">
        {ITEMS.map((it) => {
          const on = active(it);
          return (
            <Link key={it.href} href={it.href} aria-current={on ? "page" : undefined}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] font-semibold transition ${on ? "bg-fire-soft text-fire-text" : "text-muted hover:bg-surface-2 hover:text-ink"}`}>
              <it.icon size={22} weight={on ? "fill" : "regular"} />
              {it.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  // Hidden while a test is running so it does not cover the answer controls
  if (/^\/app\/(reading|listening|writing|speaking)\//.test(path)) return null;
  return (
    <nav aria-label="Основное меню" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {ITEMS.map((it) => {
          const on = active(it);
          return (
            <Link key={it.href} href={it.href} aria-current={on ? "page" : undefined}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition active:scale-95 ${on ? "text-fire-text" : "text-muted"}`}>
              <it.icon size={24} weight={on ? "fill" : "regular"} />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
