import Link from "next/link";
import { Check, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { PLANS, discounted } from "@/lib/pricing";

/** Plan cards, shared by the landing and the pricing page. */
export function PlanCards({ discount = 0, signedIn, compact = false }: { discount?: number; signedIn: boolean; compact?: boolean }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {PLANS.map((p) => {
        const price = p.key === "free" ? 0 : discounted(p.price, discount);
        const href = p.key === "free" ? (signedIn ? "/app" : "/quiz") : signedIn ? `/pricing/checkout?plan=${p.key}` : `/quiz?plan=${p.key}`;
        return (
          <div
            key={p.key}
            className={`heat tilt relative flex flex-col rounded-[2rem] p-6 md:p-8 ${p.popular ? "bg-ink text-bg" : "veil"}`}
            style={p.popular ? { boxShadow: "0 30px 70px -36px rgb(255 90 31 / 0.65)" } : undefined}
          >
            {p.popular && <span className="absolute -top-3 left-6 rounded-full bg-fire px-3 py-1 text-xs font-bold text-[#1b1433]">Самый популярный</span>}
            <p className="display text-2xl font-bold">{p.name}</p>
            <p className={`mt-1 text-sm ${p.popular ? "opacity-75" : "text-muted"}`}>{p.pitch}</p>
            <p className="mt-6 flex items-baseline gap-2">
              <span className="display text-5xl font-extrabold">{price}</span>
              <span className={p.popular ? "opacity-75" : "text-muted"}>₽{p.price ? " / месяц" : " навсегда"}</span>
            </p>
            {discount > 0 && p.price > 0 && <p className="mt-1 text-sm font-bold text-fire-text">Твоя скидка {discount}% на первый месяц</p>}
            {!compact && (
              <ul className="mt-6 grid gap-3 text-[15px]">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5"><Check size={18} weight="bold" className="mt-0.5 shrink-0 text-fire" />{f}</li>
                ))}
              </ul>
            )}
            <Link href={href} className={`btn mt-8 w-full ${p.popular ? "btn-fire" : p.key === "free" ? "btn-ghost" : "btn-ink"}`}>
              {p.key === "free" ? "Начать бесплатно" : `Выбрать ${p.name}`}
            </Link>
            {p.price > 0 && <p className={`mt-3 text-center text-xs ${p.popular ? "opacity-70" : "text-muted"}`}>Оплата за месяц, без автосписаний</p>}
          </div>
        );
      })}
    </div>
  );
}

export function GuaranteeStrip() {
  return (
    <Link href="/guarantee" className="veil mt-4 flex flex-wrap items-center gap-4 rounded-[2rem] p-5 transition hover:-translate-y-0.5 md:p-6">
      <span className="grid size-12 place-items-center rounded-2xl bg-fire-soft text-fire-text"><ShieldCheck size={28} weight="duotone" /></span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">Гарантия результата в Pro+</span>
        <span className="text-sm text-muted">Подними общий балл на 1.0 или вернём деньги за подписку. Условия на странице гарантии.</span>
      </span>
    </Link>
  );
}
