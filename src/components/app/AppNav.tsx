"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cards, ChartLineUp, House, Barbell, UserCircle } from "@phosphor-icons/react";

const ITEMS = [
  { href: "/app", label: "Сегодня", icon: House, exact: true },
  { href: "/app/practice", label: "Практика", icon: Barbell, match: ["/app/practice", "/app/reading", "/app/listening", "/app/writing", "/app/speaking"] },
  { href: "/app/words", label: "Слова", icon: Cards },
  { href: "/app/progress", label: "Прогресс", icon: ChartLineUp },
  { href: "/app/profile", label: "Профиль", icon: UserCircle },
];

export function AppNav({ variant }: { variant: "side" | "bottom" }) {
  const path = usePathname();
  const active = (it: (typeof ITEMS)[number]) =>
    it.exact ? path === it.href : (it.match ?? [it.href]).some((p) => path.startsWith(p));

  if (variant === "side") {
    return (
      <nav className="mt-10 grid gap-1">
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

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
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
