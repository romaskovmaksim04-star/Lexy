"use client";

import { useActionState } from "react";
import { LockKey } from "@phosphor-icons/react";
import { startCheckout, type CheckoutState } from "../actions";

export function CheckoutForm({ plan, enabled }: { plan: string; enabled: boolean }) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(startCheckout, undefined);
  return (
    <form action={action} className="mt-4 grid gap-3">
      <input type="hidden" name="plan" value={plan} />
      <button disabled={pending} className="btn btn-fire w-full py-4 text-base">
        <LockKey size={18} weight="fill" /> {pending ? "Создаём счёт…" : "Перейти к оплате"}
      </button>
      {!enabled && !state?.error && <p className="text-sm text-muted">Оплата откроется после тестового периода.</p>}
      {state?.error && <p role="alert" className="text-sm font-semibold text-bad">{state.error}</p>}
    </form>
  );
}
