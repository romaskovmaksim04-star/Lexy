import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle, Clock, XCircle } from "@phosphor-icons/react/dist/ssr";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { settleOrder } from "@/lib/orders";
import { MarketingShell } from "@/components/MarketingShell";
import { Mascot } from "@/components/ui/Mascot";

export const metadata: Metadata = { title: "Оплата", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PayReturn({ searchParams }: { searchParams: Promise<{ o?: string; f?: string }> }) {
  const { o } = await searchParams;
  const user = await currentUser();
  if (!user) redirect("/login");
  const order = o ? await db.order.findFirst({ where: { id: o, userId: user.id } }) : null;
  if (!order) redirect("/pricing");
  const status = await settleOrder(order.id);
  const fresh = await db.user.findUnique({ where: { id: user.id } });

  return (
    <MarketingShell fire={status === "paid"}>
      {status === "pending" && <meta httpEquiv="refresh" content="4" />}
      <section className="mx-auto grid max-w-xl justify-items-center gap-5 px-4 py-20 text-center">
        {status === "paid" && (
          <>
            <Mascot animated className="bob w-28" />
            <CheckCircle size={44} weight="fill" className="text-ok" />
            <h1 className="display text-3xl font-bold">Оплата подтверждена!</h1>
            <p className="text-muted">Premium активен до {fresh?.premiumUntil?.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}. Все проверки и разговоры с Lexi теперь почти без ограничений.</p>
            <Link href="/app" className="btn btn-fire">Перейти к занятиям</Link>
          </>
        )}
        {status === "pending" && (
          <>
            <Clock size={44} weight="duotone" className="text-fire-text" />
            <h1 className="display text-3xl font-bold">Ждём подтверждение оплаты</h1>
            <p className="text-muted">Обычно это занимает до минуты. Страница обновится сама, не закрывай её. Если уже оплатил(а), доступ включится автоматически, даже если уйти отсюда.</p>
          </>
        )}
        {status === "failed" && (
          <>
            <XCircle size={44} weight="fill" className="text-bad" />
            <h1 className="display text-3xl font-bold">Оплата не прошла</h1>
            <p className="text-muted">Деньги не списаны. Попробуй ещё раз или выбери другой способ оплаты.</p>
            <Link href={`/pricing/checkout?plan=${order.planKey}`} className="btn btn-fire">Попробовать снова</Link>
            <Link href="/support" className="text-sm font-semibold text-muted underline">Нужна помощь?</Link>
          </>
        )}
      </section>
    </MarketingShell>
  );
}
