"use client";

import { useActionState, useState, useTransition } from "react";
import { GoogleLogo } from "@phosphor-icons/react";
import { login, sendLoginCode, verifyLoginCode } from "@/app/actions";

// Google and email codes go through Supabase (the accounts from Maks's site live there);
// the password form stays for accounts made in our quiz.
export function LoginForm({ next = "/app" }: { next?: string }) {
  const [mode, setMode] = useState<"code" | "password">("code");
  return (
    <div className="grid gap-5">
      <a href={`/auth/google?next=${encodeURIComponent(next)}`} className="btn btn-ghost w-full justify-center py-4 text-base">
        <GoogleLogo size={20} weight="bold" /> Войти через Google
      </a>
      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-muted"><span className="h-px flex-1 bg-line" />или<span className="h-px flex-1 bg-line" /></div>
      {mode === "code" ? <CodeForm next={next} /> : <PasswordForm next={next} />}
      <button type="button" onClick={() => setMode(mode === "code" ? "password" : "code")} className="text-sm font-semibold text-muted underline underline-offset-4 hover:text-ink">
        {mode === "code" ? "Войти с паролем" : "Войти по коду на почту"}
      </button>
    </div>
  );
}

function CodeForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const send = () => start(async () => {
    setError("");
    const r = await sendLoginCode(email);
    if (r.ok) setSent(true); else setError(r.error ?? "");
  });
  const verify = () => start(async () => {
    setError("");
    const r = await verifyLoginCode(email, code, next);
    if (r?.error) setError(r.error);
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (sent) verify(); else send(); }} className="grid gap-5">
      <div className="grid gap-2">
        <label htmlFor="email" className="label">Email</label>
        <input id="email" type="email" autoComplete="email" required value={email} disabled={sent}
          onChange={(e) => setEmail(e.target.value)} className="field" />
      </div>
      {sent && (
        <div className="grid gap-2">
          <label htmlFor="code" className="label">Код из письма</label>
          <input id="code" inputMode="numeric" autoComplete="one-time-code" required autoFocus maxLength={8} value={code}
            onChange={(e) => setCode(e.target.value)} className="field tracking-[0.4em]" />
          <button type="button" onClick={() => { setSent(false); setCode(""); }} className="justify-self-start text-sm font-semibold text-muted underline underline-offset-4">Другой email</button>
        </div>
      )}
      <p className="min-h-5 text-sm font-medium text-bad" role="alert">{error}</p>
      <button type="submit" disabled={pending} className="btn btn-fire w-full py-4 text-base">
        {pending ? "Секунду…" : sent ? "Войти" : "Получить код"}
      </button>
    </form>
  );
}

function PasswordForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="next" value={next} />
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
