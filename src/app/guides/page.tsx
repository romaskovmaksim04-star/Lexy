import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { MarketingShell } from "@/components/MarketingShell";
import { CATS, GUIDES } from "@/lib/content/guides";

export const metadata: Metadata = {
  title: "Гайды по IELTS",
  description: "Как устроен IELTS и как набрать балл в каждой секции: критерии оценки, стратегии Listening и Reading, структура эссе, Speaking.",
};

export default function Guides() {
  return (
    <MarketingShell fire={false}>
      <section className="mx-auto max-w-5xl px-4 pb-24 pt-12 md:px-8 md:pt-20">
        <span className="inline-flex rounded-full bg-fire-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-fire-text">● Гайды</span>
        <h1 className="display mt-4 text-4xl font-extrabold md:text-5xl">Гайды по IELTS</h1>
        <p className="mt-4 max-w-[56ch] text-lg text-muted">Коротко и по делу: как считают баллы, чем ловят в Listening и Reading, как строить эссе и держаться на Speaking. Есть ещё <Link href="/universities" className="font-semibold text-ink underline underline-offset-4">требования вузов к IELTS</Link>.</p>
        {Object.entries(CATS).map(([cat, name]) => (
          <div key={cat} className="mt-12">
            <h2 className="display text-2xl font-bold">{name}</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {GUIDES.filter((g) => g.cat === cat).map((g) => (
                <Link key={g.id} href={`/guides/${g.id}`} className="card group flex flex-col p-5 transition hover:-translate-y-1">
                  <span className="font-bold">{g.title}</span>
                  <span className="mt-2 flex-1 text-sm text-muted">{g.desc}</span>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-fire-text">Читать <ArrowRight size={14} weight="bold" className="transition group-hover:translate-x-1" /></span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </MarketingShell>
  );
}
