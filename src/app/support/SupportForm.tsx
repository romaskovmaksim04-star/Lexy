"use client";

import { useActionState } from "react";
import { CheckCircle, PaperPlaneTilt } from "@phosphor-icons/react";
import { sendTicket, type TicketState } from "./actions";

const TOPICS = [
  { v: "payment", l: "Оплата и возврат" },
  { v: "speaking", l: "Микрофон и Speaking" },
  { v: "account", l: "Вход и аккаунт" },
  { v: "guarantee", l: "Гарантия результата" },
  { v: "other", l: "Другое" },
];

export function SupportForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<TicketState, FormData>(sendTicket, undefined);
  if (state?.ok) {
    return (
      <div role="status" className="grid justify-items-center gap-3 py-6 text-center">
        <CheckCircle size={44} weight="fill" className="text-ok" />
        <p className="display text-xl font-bold">Сообщение отправлено</p>
        <p className="text-muted">Ответим на {state.email}. Проверь и папку «Спам».</p>
      </div>
    );
  }
  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-2 md:grid-cols-2 md:gap-5">
        <div className="grid gap-2">
          <label htmlFor="t-email" className="label">Email для ответа</label>
          <input id="t-email" name="email" type="email" defaultValue={email} required autoComplete="email" className="field" />
        </div>
        <div className="grid gap-2">
          <label htmlFor="t-topic" className="label">Тема</label>
          <select id="t-topic" name="topic" className="field" defaultValue="other">
            {TOPICS.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
        </div>
      </div>
      <div className="grid gap-2">
        <label htmlFor="t-text" className="label">Что случилось?</label>
        <textarea id="t-text" name="text" required minLength={10} maxLength={3000} className="field min-h-36" />
        <p className="text-xs text-muted">Опиши, что ты делал(а), когда возникла проблема. Если вопрос про оплату, укажи дату и сумму.</p>
      </div>
      {state?.error && <p role="alert" className="text-sm font-semibold text-bad">{state.error}</p>}
      <button disabled={pending} className="btn btn-fire w-fit"><PaperPlaneTilt size={18} weight="fill" /> {pending ? "Отправляем…" : "Отправить"}</button>
    </form>
  );
}
