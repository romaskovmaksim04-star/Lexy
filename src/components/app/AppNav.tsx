"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, Cards, ChartLineUp, ChatsCircle, DotsThreeOutline, Exam, GameController, House, Lock, UserCircle, X } from "@phosphor-icons/react";

type Item = { href: string; label: string; icon: typeof House; exact?: boolean; free?: boolean; match?: string[] };

const HOME: Item = { href: "/app", label: "Главная", icon: House, exact: true, free: true };
const COURSE: Item = { href: "/app/course", label: "Курс", icon: BookOpenText };
const TESTS: Item = { href: "/app/tests", label: "Тесты", icon: Exam, match: ["/app/tests", "/app/reading", "/app/listening", "/app/writing", "/app/speaking", "/app/results"] };
const LEXI: Item = { href: "/app/lexi", label: "Lexi", icon: ChatsCircle };
const WORDS: Item = { href: "/app/words", label: "Словарь", icon: Cards };
const PROGRESS: Item = { href: "/app/progress", label: "Прогресс", icon: ChartLineUp };
const GAMES: Item = { href: "/app/games", label: "Игры", icon: GameController, free: true };
const PROFILE: Item = { href: "/app/profile", label: "Профиль", icon: UserCircle, free: true };

// The goal picked in the quiz or profile decides which of course and tests comes first
function order(goal: string): Item[] {
  return goal === "english" ? [HOME, COURSE, LEXI, WORDS, TESTS, PROGRESS, GAMES] : [HOME, TESTS, LEXI, WORDS, COURSE, PROGRESS, GAMES];
}

// Items without `free` are behind Premium: a free user sees a lock next to them
export function AppNav({ variant, premium, goal }: { variant: "side" | "bottom"; premium: boolean; goal: string }) {
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [path]);
  const active = (it: Item) => (it.exact ? path === it.href : (it.match ?? [it.href]).some((p) => path.startsWith(p)));
  const items = order(goal);
  const lock = (it: Item, size: number, cls: string) => !premium && !it.free && <Lock size={size} weight="fill" className={cls} />;

  if (variant === "side") {
    return (
      <nav className="mt-10 grid gap-1" aria-label="Основное меню">
        {items.map((it) => {
          const on = active(it);
          return (
            <Link key={it.href} href={it.href} aria-current={on ? "page" : undefined}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] font-semibold transition ${on ? "bg-fire-soft text-fire-text" : "text-muted hover:bg-surface-2 hover:text-ink"}`}>
              <it.icon size={22} weight={on ? "fill" : "regular"} />
              <span className="flex-1">{it.label}</span>
              {lock(it, 16, "opacity-50")}
            </Link>
          );
        })}
      </nav>
    );
  }

  // Hidden while a test or lesson is running so it does not cover the answer controls
  if (/^\/app\/(reading|listening|writing|speaking)\/|^\/app\/course\/[A-C]\d\//.test(path)) return null;
  const main = items.slice(0, 4);
  const rest = [...items.slice(4), PROFILE];
  const moreOn = rest.some(active);
  return (
    <>
      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-label="Все разделы">
          <button aria-label="Закрыть" onClick={() => setMenu(false)} className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[2rem] bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="display text-lg font-bold">Разделы</p>
              <button onClick={() => setMenu(false)} aria-label="Закрыть" className="grid size-10 place-items-center rounded-full hover:bg-surface-2"><X size={22} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[...main, ...rest].map((it) => {
                const on = active(it);
                return (
                  <Link key={it.href} href={it.href} className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 font-semibold ${on ? "bg-fire-soft text-fire-text" : "bg-surface-2"}`}>
                    <it.icon size={22} weight={on ? "fill" : "regular"} />
                    <span className="flex-1">{it.label}</span>
                    {lock(it, 14, "opacity-50")}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <nav aria-label="Основное меню" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {main.map((it) => {
            const on = active(it);
            return (
              <Link key={it.href} href={it.href} aria-current={on ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition active:scale-95 ${on ? "text-fire-text" : "text-muted"}`}>
                <span className="relative">
                  <it.icon size={24} weight={on ? "fill" : "regular"} />
                  {lock(it, 11, "absolute -right-1.5 -top-1 opacity-60")}
                </span>
                {it.label}
              </Link>
            );
          })}
          <button onClick={() => setMenu(true)} aria-expanded={menu}
            className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition active:scale-95 ${moreOn ? "text-fire-text" : "text-muted"}`}>
            <DotsThreeOutline size={24} weight={moreOn ? "fill" : "regular"} />
            Ещё
          </button>
        </div>
      </nav>
    </>
  );
}
