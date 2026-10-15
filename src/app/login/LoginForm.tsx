"use client";

import { useActionState } from "react";
import { login } from "@/app/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-2">
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="field" />
      </div>
      <div className="grid gap-2">
        <label htmlFor="password" className="label">Пароль</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
      </div>
      <p className="min-h-5 text-sm font-medium text-bad" role="alert">{state?.error ?? ""}</p>
      <button type="submit" disabled={pending} className="btn btn-fire w-full py-4 text-base">
        {pending ? "Вхожу…" : "Войти"}
      </button>
    </form>
  );
}
