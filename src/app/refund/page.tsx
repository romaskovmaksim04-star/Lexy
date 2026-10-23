import type { Metadata } from "next";
import Link from "next/link";
import { DocPage, DocSection } from "@/components/DocPage";

export const metadata: Metadata = { title: "Политика возврата" };

export default function Refund() {
  return (
    <DocPage title="Политика возврата" updated="21 октября 2026">
      <DocSection title="14 дней на возврат">
        <p>Если GoLexi тебе не подошёл, мы вернём деньги полностью в течение 14 календарных дней с момента оплаты. Достаточно написать в <Link href="/support" className="font-semibold underline">поддержку</Link> с email аккаунта и датой платежа.</p>
      </DocSection>
      <DocSection title="Как устроена оплата">
        <p>Каждая покупка — это один оплаченный месяц доступа. Автоматических списаний нет: подписка не продлевается сама, поэтому отменять ничего не нужно. Доступ заканчивается вместе с оплаченным периодом, прогресс сохраняется.</p>
      </DocSection>
      <DocSection title="Сроки возврата">
        <p>Деньги возвращаются на ту же карту или счёт, с которых была оплата. Обычно это занимает до 10 рабочих дней, в зависимости от банка.</p>
      </DocSection>
      <DocSection title="Гарантия результата">
        <p>Для тарифа Pro+ отдельно действует <Link href="/guarantee" className="font-semibold underline">гарантия результата</Link> со своими условиями.</p>
      </DocSection>
      <DocSection title="Перед удалением аккаунта">
        <p>Если хочешь вернуть деньги, сначала оформи возврат и только потом удаляй аккаунт: после удаления мы не сможем найти платёж.</p>
      </DocSection>
    </DocPage>
  );
}
