import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { MarketingShell } from "@/components/MarketingShell";
import { UNIS } from "@/lib/content/guides";

export const metadata: Metadata = {
  title: "Требования вузов к IELTS",
  description: "Какой балл IELTS просят Harvard, Oxford, Cambridge и другие университеты мира: минимумы и ссылки на официальные страницы.",
};

export default function Universities() {
  return (
    <MarketingShell fire={false}>
      <section className="mx-auto max-w-5xl px-4 pb-24 pt-12 md:px-8 md:pt-20">
        <span className="inline-flex rounded-full bg-fire-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-fire-text">● Вузы</span>
        <h1 className="display mt-4 text-4xl font-extrabold md:text-5xl">Требования вузов к IELTS</h1>
        <p className="mt-4 max-w-[60ch] text-lg text-muted">Минимальный балл, который просят университеты. Требования меняются: перед подачей сверяйся с официальной страницей по ссылке.</p>
        <div className="mt-10 grid gap-3 md:grid-cols-2">
          {UNIS.map((u) => (
            <a key={u.name} href={u.url} target="_blank" rel="noopener noreferrer" className="card group flex gap-4 p-5 transition hover:-translate-y-0.5">
              <span className="text-3xl leading-none">{u.flag}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2"><span className="font-bold">{u.name}</span><ArrowUpRight size={16} className="shrink-0 text-muted transition group-hover:text-ink" /></span>
                <span className="text-sm text-muted">{u.region}</span>
                <span className="mt-2 block"><span className="display text-2xl font-extrabold">{u.band}</span> <span className="text-sm text-muted">{u.label}</span></span>
                <span className="mt-1 block text-sm">{u.note}</span>
              </span>
            </a>
          ))}
        </div>
        <p className="mt-10 text-muted">Нужен конкретный балл к дедлайну? <Link href="/quiz" className="font-semibold text-ink underline underline-offset-4">Собери план подготовки</Link>.</p>
      </section>
    </MarketingShell>
  );
}
