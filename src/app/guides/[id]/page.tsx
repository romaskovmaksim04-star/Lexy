import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { MarketingShell } from "@/components/MarketingShell";
import { CATS, GUIDES } from "@/lib/content/guides";


export function generateStaticParams() {
  return GUIDES.map((g) => ({ id: g.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const g = GUIDES.find((x) => x.id === id);
  return g ? { title: g.title, description: g.desc } : {};
}

export default async function GuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = GUIDES.find((x) => x.id === id);
  if (!g) notFound();
  const more = GUIDES.filter((x) => x.cat === g.cat && x.id !== g.id);
  return (
    <MarketingShell fire={false}>
      <article className="mx-auto max-w-3xl px-4 pb-24 pt-10 md:px-8 md:pt-16">
        <Link href="/guides" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-ink"><ArrowLeft size={16} /> Все гайды</Link>
        <p className="mt-6 text-xs font-bold uppercase tracking-wide text-fire-text">{CATS[g.cat]}</p>
        <h1 className="display mt-2 text-3xl font-extrabold md:text-4xl">{g.title}</h1>
        <p className="mt-3 text-lg text-muted">{g.desc}</p>
        <div className="mt-8 leading-relaxed [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-bold [&_li]:mt-1.5 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-4 [&_strong]:font-bold [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: g.body }} />
        <div className="mt-12 rounded-[2rem] bg-ink p-6 text-bg md:p-8">
          <p className="display text-2xl font-bold">Проверь себя на настоящем задании</p>
          <p className="mt-2 opacity-75">Пробные тесты с разбором и прогнозом балла.</p>
          <Link href="/quiz" className="btn btn-fire mt-5">Начать подготовку</Link>
        </div>
        {more.length > 0 && (
          <div className="mt-12 grid gap-3 md:grid-cols-2">
            {more.map((x) => <Link key={x.id} href={`/guides/${x.id}`} className="card p-5 font-bold transition hover:-translate-y-0.5">{x.title}</Link>)}
          </div>
        )}
      </article>
    </MarketingShell>
  );
}
