import type { Metadata } from "next";
import { CreditCard, Lightning, LockKey } from "@phosphor-icons/react/dist/ssr";
import { currentUser } from "@/lib/auth";
import { MarketingShell } from "@/components/MarketingShell";
import { PlanCards, GuaranteeStrip } from "@/components/landing/Pricing";
import { openBeta } from "@/lib/access";

export const metadata: Metadata = {
  title: "Тарифы",
  description: "Тарифы GoLexi: Free, Pro и Pro+. Оплата картой или СБП за месяц, без автосписаний.",
};

const POINTS = [
  { icon: CreditCard, title: "Карта или СБП", text: "Оплата на защищённой странице Platega." },
  { icon: Lightning, title: "Доступ сразу", text: "Premium включается, как только платёж подтвердится." },
  { icon: LockKey, title: "Без автосписаний", text: "Платишь за месяц. Захочешь дальше, продлишь сам." },
];

export default async function PricingPage() {
  const user = await currentUser();
  return (
    <MarketingShell>
      <section className="mx-auto max-w-7xl px-4 pb-20 pt-12 md:px-8 md:pt-20">
        <h1 className="display max-w-[16ch] text-4xl font-extrabold leading-[1.05] md:text-6xl">Выбери свой план</h1>
        <p className="mt-5 max-w-[52ch] text-lg text-muted">Начни бесплатно и переходи на Pro, когда захочешь больше. Весь прогресс сохраняется.</p>
        {openBeta() && (
          <p className="mt-6 inline-flex rounded-full bg-fire-soft px-4 py-2 text-sm font-bold text-fire-text">Сейчас открытое тестирование: все функции бесплатны</p>
        )}
        <div className="mt-12"><PlanCards signedIn={!!user} discount={user?.discount ?? 0} /></div>
        <GuaranteeStrip />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {POINTS.map((p) => (
            <div key={p.title} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-fire-soft text-fire-text"><p.icon size={24} weight="duotone" /></span>
              <div><p className="font-bold">{p.title}</p><p className="mt-1 text-sm text-muted">{p.text}</p></div>
            </div>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
