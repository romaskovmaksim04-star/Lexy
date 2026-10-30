import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { liveStreak } from "@/lib/profile";
import { isPremium } from "@/lib/access";
import { db } from "@/lib/db";
import { NoticeBar } from "@/components/app/NoticeBar";
import { TelegramLogo } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/ui/Mascot";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AppNav } from "@/components/app/AppNav";
import { WakeLock } from "@/components/fx/WakeLock";
import { Flame } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = { title: { default: "Мой план", template: "%s · LexiUp" } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const streak = liveStreak(user.streak, user.lastActive);
  const premium = isPremium(user);
  const notice = await db.notice.findFirst({ where: { active: true, audience: { in: ["all", premium ? "premium" : "free"] } }, orderBy: { createdAt: "desc" } });

  return (
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-[100dvh] flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
        <Link href="/" className="px-3"><Logo /></Link>
        <AppNav variant="side" premium={premium} goal={user.goal} />
        <a href="https://t.me/LexiEnglishWorld" target="_blank" rel="noopener noreferrer" className="mt-auto mb-4 flex items-center gap-3 rounded-2xl bg-surface-2 p-3 transition hover:bg-fire-soft">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#2aabee] text-white"><TelegramLogo size={20} weight="fill" /></span>
          <span className="min-w-0"><span className="block text-sm font-bold">Наш Telegram-канал</span><span className="block text-xs text-muted">Лайфхаки и разбор ошибок</span></span>
        </a>
        <div className="flex items-center justify-between px-2">
          <Link href="/app/profile" className="flex min-w-0 items-center gap-3 rounded-2xl px-1 py-1.5 hover:bg-surface-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-fire-soft text-sm font-bold text-fire-text">{user.name.slice(0, 1).toUpperCase()}</span>
            <span className="truncate text-sm font-semibold">{user.name}</span>
          </Link>
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col pb-24 lg:pb-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-bg/85 px-4 backdrop-blur-xl lg:hidden">
          <Link href="/app"><Logo /></Link>
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-fire-soft px-3 py-1.5 text-sm font-bold text-fire-text" aria-label={`Серия: ${streak} дн.`}>
              <Flame size={16} weight="fill" /> {streak}
            </span>
            <ThemeToggle />
            <Link href="/app/profile" aria-label="Профиль" className="grid size-9 place-items-center rounded-full bg-fire-soft text-sm font-bold text-fire-text">
              {user.name.slice(0, 1).toUpperCase()}
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8 md:py-10">
          {notice && <NoticeBar id={notice.id} text={notice.text} link={notice.link} />}
          {children}
        </main>
      </div>

      <AppNav variant="bottom" premium={premium} goal={user.goal} />
      {/* Phone stays awake during a lesson / Lexi call / game (WakeLock). */}
      <WakeLock />
    </div>
  );
}
