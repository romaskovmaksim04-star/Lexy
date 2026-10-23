import { MarketingShell } from "@/components/MarketingShell";

/** Text pages: terms, privacy, refunds, guarantee. */
export function DocPage({ title, lead, updated, children }: { title: string; lead?: string; updated?: string; children: React.ReactNode }) {
  return (
    <MarketingShell fire={false}>
      <article className="mx-auto max-w-3xl px-4 py-12 md:py-20">
        <h1 className="display text-4xl font-extrabold leading-[1.08] md:text-5xl">{title}</h1>
        {lead && <p className="mt-5 text-lg leading-relaxed text-muted">{lead}</p>}
        {updated && <p className="mt-3 text-sm text-muted">Обновлено {updated}</p>}
        <div className="doc mt-10 grid gap-8">{children}</div>
      </article>
    </MarketingShell>
  );
}

export function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="display text-xl font-bold md:text-2xl">{title}</h2>
      <div className="mt-3 grid gap-3 text-[16px] leading-relaxed text-ink/90">{children}</div>
    </section>
  );
}
