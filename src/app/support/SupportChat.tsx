"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle, PaperPlaneTilt, UserSound } from "@phosphor-icons/react";
import { Mascot } from "@/components/ui/Mascot";
import { askSupport, callHuman, type BotMessage } from "./bot";

const HELLO: BotMessage = { role: "bot", text: "Привет! Я Lexi. Спроси про оплату, тарифы, микрофон или аккаунт. Если не справлюсь, позову человека из команды." };

export function SupportChat({ email: initialEmail }: { email: string }) {
  const [messages, setMessages] = useState<BotMessage[]>([HELLO]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const [email, setEmail] = useState(initialEmail);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    list.current?.lastElementChild?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages, handoff]);

  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = text.trim();
    if (!q || busy) return;
    const next = [...messages, { role: "user" as const, text: q }];
    setMessages(next);
    setText("");
    setBusy(true);
    const r = await askSupport(next.slice(1)).catch(() => ({ text: "Связь прервалась. Попробуй ещё раз или позови человека.", handoff: true }));
    setMessages([...next, { role: "bot", text: r.text }]);
    if (r.handoff) setHandoff(true);
    setBusy(false);
  };

  const human = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const history = messages.slice(1);
    if (!history.length) {
      setError("Сначала опиши, что случилось, одним сообщением.");
      return;
    }
    setBusy(true);
    const r = await callHuman({ email, history });
    setBusy(false);
    if (r.ok) setSent(true);
    else setError(r.error ?? "Не получилось отправить, попробуй ещё раз.");
  };

  return (
    <div className="grid gap-4">
      <ol ref={list} className="grid max-h-[26rem] gap-3 overflow-y-auto pr-1" aria-live="polite">
        {messages.map((m, i) => (
          <li key={i} className={`flex max-w-[88%] gap-2 ${m.role === "user" ? "ml-auto" : ""}`}>
            {m.role === "bot" && <Mascot className="mt-1 w-7 shrink-0" />}
            <p className={`rounded-3xl px-4 py-3 text-[15px] leading-relaxed ${m.role === "user" ? "bg-fire-soft" : "bg-surface-2"}`}>{m.text}</p>
          </li>
        ))}
        {busy && !sent && (
          <li className="flex gap-2">
            <Mascot className="mt-1 w-7 shrink-0 animate-pulse" />
            <p className="rounded-3xl bg-surface-2 px-4 py-3 text-[15px] text-muted">Lexi печатает…</p>
          </li>
        )}
      </ol>

      {sent ? (
        <div role="status" className="flex items-center gap-3 rounded-3xl bg-ok-soft p-4 text-ok">
          <CheckCircle size={28} weight="fill" className="shrink-0" />
          <p className="font-semibold">Передала команде. Ответим на {email}, обычно в течение рабочего дня.</p>
        </div>
      ) : handoff ? (
        <form onSubmit={human} className="grid gap-3 rounded-3xl border border-line p-4">
          <p className="font-bold">Позвать человека</p>
          <p className="text-sm text-muted">Команда увидит весь этот разговор и ответит на почту.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="h-email" className="sr-only">Email для ответа</label>
            <input id="h-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email для ответа" autoComplete="email" className="field flex-1" />
            <button disabled={busy} className="btn btn-fire"><UserSound size={18} weight="fill" /> Позвать</button>
          </div>
          {error && <p role="alert" className="text-sm font-semibold text-bad">{error}</p>}
        </form>
      ) : null}

      {!sent && (
        <form onSubmit={ask} className="flex gap-2">
          <label htmlFor="s-text" className="sr-only">Вопрос</label>
          <input id="s-text" value={text} onChange={(e) => setText(e.target.value)} maxLength={1500} placeholder="Напиши вопрос…" className="field flex-1" autoComplete="off" />
          <button disabled={busy || !text.trim()} className="btn btn-fire" aria-label="Отправить"><PaperPlaneTilt size={18} weight="fill" /></button>
        </form>
      )}
      {!handoff && !sent && (
        <button type="button" onClick={() => setHandoff(true)} className="w-fit text-sm font-semibold text-muted underline underline-offset-4 hover:text-ink">
          Сразу позвать человека
        </button>
      )}
    </div>
  );
}
