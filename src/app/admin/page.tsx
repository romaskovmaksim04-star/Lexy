import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { isPremium } from "@/lib/access";
import { Logo } from "@/components/ui/Mascot";
import { GrantButtons, HideNotice, NoticeForm } from "./AdminClient";

export const metadata: Metadata = { title: "Админка", robots: { index: false } };

const day = (d: Date | null) => (d ? d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "2-digit" }) : "—");

export default async function Admin({ searchParams }: { searchParams: Promise<{ q?: string; f?: string }> }) {
  await requireAdmin();
  const { q = "", f = "all" } = await searchParams;
  const now = new Date();
  const week = new Date(now.getTime() - 7 * 86_400_000);
  const where = {
    ...(q ? { OR: [{ email: { contains: q.toLowerCase() } }, { name: { contains: q } }] } : {}),
    ...(f === "premium" ? { plan: { not: "free" }, premiumUntil: { gt: now } } : {}),
    ...(f === "free" ? { NOT: { plan: { not: "free" }, premiumUntil: { gt: now } } } : {}),
  };
  const [total, premium, fresh, paid, users, notices] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { plan: { not: "free" }, premiumUntil: { gt: now } } }),
    db.user.count({ where: { createdAt: { gt: week } } }),
    db.order.aggregate({ where: { status: "paid" }, _sum: { amount: true }, _count: true }),
    db.user.findMany({ where, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, email: true, name: true, plan: true, premiumUntil: true, createdAt: true, lastActive: true, goal: true } }),
    db.notice.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const cards: [string, string | number][] = [
    ["Пользователей", total], ["Premium сейчас", premium], ["Новых за 7 дней", fresh],
    ["Оплат", `${paid._count} · ${(paid._sum.amount ?? 0).toLocaleString("ru-RU")} ₽`],
  ];

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:px-8">
      <div className="flex items-center justify-between gap-3"><Link href="/app"><Logo /></Link><span className="chip">Админка</span></div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([k, v]) => <div key={k} className="card p-5"><p className="text-sm text-muted">{k}</p><p className="display mt-1 text-2xl font-extrabold">{v}</p></div>)}
      </div>

      <section className="card grid gap-4 p-5">
        <h2 className="font-bold">Уведомление в кабинете</h2>
        <NoticeForm />
        {notices.map((n) => (
          <div key={n.id} className="flex items-start gap-3 rounded-2xl bg-surface-2 p-3 text-sm">
            <span className="chip shrink-0">{n.audience === "all" ? "всем" : n.audience === "free" ? "бесплатным" : "Premium"}</span>
            <span className="flex-1">{n.text}{n.link && <span className="text-muted"> → {n.link}</span>}</span>
            <HideNotice id={n.id} />
          </div>
        ))}
      </section>

      <section className="grid gap-4">
        <form className="flex flex-wrap gap-2">
          <input name="q" defaultValue={q} placeholder="email или имя" className="field max-w-xs flex-1" />
          <select name="f" defaultValue={f} className="field w-auto"><option value="all">Все</option><option value="premium">Premium</option><option value="free">Бесплатные</option></select>
          <button className="btn btn-ink">Найти</button>
          <a href={`/admin/export?f=${f}`} className="btn btn-ghost">CSV</a>
        </form>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-left text-muted"><tr>{["Пользователь", "Цель", "Тариф", "До", "Регистрация", "Был", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-line">
                  <td className="px-4 py-3"><span className="block font-semibold">{u.name}</span><span className="text-muted">{u.email}</span></td>
                  <td className="px-4 py-3">{u.goal === "english" ? "Английский" : "IELTS"}</td>
                  <td className="px-4 py-3">{isPremium(u) ? <span className="font-bold text-ok">{u.plan}</span> : "free"}</td>
                  <td className="px-4 py-3">{day(u.premiumUntil)}</td>
                  <td className="px-4 py-3">{day(u.createdAt)}</td>
                  <td className="px-4 py-3">{u.lastActive ?? "—"}</td>
                  <td className="px-4 py-3"><GrantButtons id={u.id} premium={isPremium(u)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 100 && <p className="text-sm text-muted">Показаны первые 100. Уточни поиск.</p>}
      </section>
    </main>
  );
}
