import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { DocPage, DocSection } from "@/components/DocPage";
import { SupportChat } from "./SupportChat";

export const metadata: Metadata = { title: "Поддержка" };

const FAQ = [
  { q: "Микрофон меня не слышит", a: "Разреши доступ к микрофону в настройках браузера или телефона и проверь, что выбран нужный микрофон. Не давай экрану гаснуть во время ответа: потухший экран обрывает запись. Лучше всего Speaking работает в Chrome, Safari и Edge." },
  { q: "Не открывается тест", a: "Проверь, что ты вошёл(ла) в аккаунт, и перезагрузи страницу. Черновик эссе сохраняется в браузере, его не потеряешь." },
  { q: "Как продлить Premium?", a: "Оплата разовая, на месяц. Когда месяц закончится, оформи тариф ещё раз на странице тарифов. Ничего не спишется само." },
  { q: "Как удалить аккаунт?", a: "«Профиль» → «Удалить аккаунт», затем подтверди своим email. Если нужен возврат денег, сначала напиши нам, потом удаляй аккаунт." },
];

export default async function Support() {
  const user = await currentUser();
  return (
    <DocPage title="Поддержка" lead="Lexi ответит сразу. Если вопрос про конкретную оплату или она не справится, позови человека: команда увидит весь разговор и ответит на почту.">
      <div className="card p-6 md:p-8">
        <SupportChat email={user?.email ?? ""} />
      </div>
      <DocSection title="Частые вопросы">
        <div className="grid gap-4">
          {FAQ.map((f) => (
            <div key={f.q}>
              <p className="font-bold">{f.q}</p>
              <p className="mt-1 text-muted">{f.a}</p>
            </div>
          ))}
        </div>
      </DocSection>
      <DocSection title="Документы">
        <p className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/terms" className="font-semibold underline">Условия использования</Link>
          <Link href="/privacy" className="font-semibold underline">Конфиденциальность</Link>
          <Link href="/refund" className="font-semibold underline">Возврат</Link>
          <Link href="/guarantee" className="font-semibold underline">Гарантия результата</Link>
        </p>
      </DocSection>
    </DocPage>
  );
}
