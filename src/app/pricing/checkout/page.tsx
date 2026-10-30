import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Check } from "@phosphor-icons/react/dist/ssr";
import { currentUser } from "@/lib/auth";
import { plan as planByKey } from "@/lib/pricing";
import { paymentsEnabled } from "@/lib/platega";
import { MarketingShell } from "@/components/MarketingShell";
import { priceFor } from "@/lib/checkout";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = { title: "Оформление подписки", robots: { index: false } };

export default async function Checkout({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan: key = "pro" } = await searchParams;
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/pricing/checkout?plan=${key}`)}`);
  const p = planByKey(key);
  if (!p || !p.price) redirect("/pricing");
  const price = (await priceFor(user.id, p.key))!;

  return (
    <MarketingShell fire={false}>
      <section className="mx-auto grid max-w-3xl gap-6 px-4 py-12 md:py-20">
        <Link href="/pricing" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={16} /> К тарифам</Link>
        <h1 className="display text-3xl font-bold md:text-4xl">Последний шаг к Band {user.targetBand.toFixed(1)}</h1>
        <div className="card grid gap-5 p-6 md:p-8">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="display text-2xl font-bold">LexiUp {p.name}</p>
              <p className="text-sm text-muted">1 месяц доступа, без автопродления</p>
            </div>
            <div className="text-right">
              <p className="display text-4xl font-extrabold">{price.amount} ₽</p>
              {price.percent > 0 && <p className="text-sm font-bold text-fire-text">скидка {price.percent}% · вместо {p.price} ₽</p>}
            </div>
          </div>
          <ul className="grid gap-2.5 border-t border-line pt-5 text-[15px]">
            {p.features.map((f) => <li key={f} className="flex gap-2.5"><Check size={18} weight="bold" className="mt-0.5 shrink-0 text-fire-text" />{f}</li>)}
          </ul>
          <div className="border-t border-line pt-5">
            <p className="text-sm text-muted">Вы вошли как {user.email}. Чек придёт на эту почту.</p>
            <CheckoutForm plan={p.key} enabled={paymentsEnabled()} />
            <p className="mt-3 text-xs text-muted">Оплата картой или СБП на защищённой странице Platega. Итоговая сумма может отличаться из-за курса вашего банка, если карта не в рублях.</p>
          </div>
        </div>
        <p className="text-sm text-muted">Нажимая кнопку, ты соглашаешься с <Link href="/terms" className="underline">условиями</Link> и <Link href="/refund" className="underline">политикой возврата</Link>.</p>
      </section>
    </MarketingShell>
  );
}
