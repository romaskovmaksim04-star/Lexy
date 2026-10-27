"use client";

import { useActionState, useTransition } from "react";
import { grantPremium, hideNotice, postNotice } from "./actions";

export function GrantButtons({ id, premium }: { id: string; premium: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-1 whitespace-nowrap">
      {[30, 90].map((d) => <button key={d} disabled={pending} onClick={() => start(() => grantPremium(id, d))} className="btn btn-sm btn-ink">+{d} дн.</button>)}
      {premium && <button disabled={pending} onClick={() => confirm("Снять Premium?") && start(() => grantPremium(id, 0))} className="btn btn-sm btn-ghost">Снять</button>}
    </div>
  );
}

export function NoticeForm() {
  const [state, action, pending] = useActionState(postNotice, undefined);
  return (
    <form action={action} className="grid gap-2 md:grid-cols-[1fr_200px_160px_auto]">
      <input name="text" required maxLength={400} placeholder="Текст: например, «Скидка 30% до воскресенья»" className="field" />
      <input name="link" placeholder="/pricing (необязательно)" className="field" />
      <select name="audience" className="field"><option value="all">Всем</option><option value="free">Бесплатным</option><option value="premium">Premium</option></select>
      <button disabled={pending} className="btn btn-fire">Опубликовать</button>
      {state?.error && <p className="text-sm text-bad md:col-span-4">{state.error}</p>}
    </form>
  );
}

export function HideNotice({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return <button disabled={pending} onClick={() => start(() => hideNotice(id))} className="font-semibold text-muted underline">Убрать</button>;
}
