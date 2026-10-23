"use client";

import { useState } from "react";
import { CheckCircle, Microphone, PenNib, Stop, Seal } from "@phosphor-icons/react";
import { checkRewrite } from "@/app/actions";
import { transcribe, useRecorder } from "@/components/app/voice-client";

export type ContractItem = { rule: string; original: string; fix: string; why: string; sentence: string; drill?: { wrong: string; right: string } };

type Status = "todo" | "close" | "miss" | "done" | "shown";

function Item({ item, n, spoken, onDone }: { item: ContractItem; n: number; spoken: boolean; onDone: () => void }) {
  const [text, setText] = useState(item.sentence);
  const [status, setStatus] = useState<Status>("todo");
  const [tries, setTries] = useState(0);
  const [busy, setBusy] = useState(false);
  const mic = useRecorder();

  const check = async (value: string) => {
    setBusy(true);
    const r = await checkRewrite(item.rule, item.sentence, value);
    setBusy(false);
    setTries((t) => t + 1);
    if (r.fixed) { setStatus("done"); onDone(); }
    else setStatus(r.close ? "close" : "miss");
  };

  const record = async () => {
    if (mic.recording) {
      const rec = await mic.stop();
      if (!rec) return;
      setBusy(true);
      const r = await transcribe(rec, "fast");
      setText(r.text);
      await check(r.text);
      return;
    }
    await mic.start();
  };

  const done = status === "done";
  return (
    <li className={`card grid gap-4 p-5 ${done ? "ring-2 ring-ok/40" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-bold">Исправление №{n}</p>
        {done && <span className="inline-flex items-center gap-1 text-sm font-bold text-ok"><CheckCircle size={18} weight="fill" /> Исправлено</span>}
      </div>
      <p className="text-sm text-muted">{item.why}</p>
      {item.drill && (
        <div className="rounded-2xl bg-surface-2 p-4 text-[15px]">
          <p className="text-xs font-bold text-muted">Та же ошибка на нейтральном примере</p>
          <p className="mt-1"><span className="text-bad line-through">{item.drill.wrong}</span></p>
          <p className="font-semibold text-ok">{item.drill.right}</p>
        </div>
      )}
      <div>
        <p className="text-xs font-bold text-muted">{spoken ? "Из твоего ответа. Теперь скажи это правильно" : "Твоё предложение. Перепиши его без этой ошибки"}</p>
        {spoken ? (
          <div className="mt-2 grid gap-3">
            <p className="rounded-2xl border border-line p-3 text-[15px]">{text}</p>
            {!done && status !== "shown" && (
              <button onClick={record} disabled={busy} className={`btn btn-sm w-fit ${mic.recording ? "btn-ink" : "btn-fire"}`}>
                {mic.recording ? <><Stop size={16} weight="fill" /> Запись… нажми, чтобы остановить</> : <><Microphone size={16} weight="fill" /> {tries ? "Ещё раз, запиши снова" : "Нажми, чтобы записать"}</>}
              </button>
            )}
          </div>
        ) : (
          <div className="mt-2 grid gap-3">
            <textarea value={text} onChange={(e) => { setText(e.target.value); if (status !== "done") setStatus("todo"); }} disabled={done || status === "shown"} className="field min-h-20 text-[15px]" />
            {!done && status !== "shown" && (
              <button onClick={() => check(text)} disabled={busy} className="btn btn-fire btn-sm w-fit"><PenNib size={16} weight="fill" /> {busy ? "Проверяем…" : "Проверить"}</button>
            )}
          </div>
        )}
      </div>
      {status === "close" && <p className="text-sm font-semibold text-fire-text">Почти, ещё один заход. Ошибка всё ещё в предложении.</p>}
      {status === "miss" && <p className="text-sm font-semibold text-bad">Пока нет. Сохрани смысл предложения и убери ошибку.</p>}
      {!done && tries >= 2 && status !== "shown" && (
        <button onClick={() => setStatus("shown")} className="w-fit text-sm font-bold text-fire-text underline underline-offset-4">Показать исправление</button>
      )}
      {status === "shown" && (
        <p className="rounded-2xl bg-ok-soft p-3 text-[15px]"><span className="font-bold text-ok">Исправленный вариант:</span> {item.sentence.replace(item.original, item.fix)}</p>
      )}
    </li>
  );
}

export function Contract({ items, target, spoken = false }: { items: ContractItem[]; target: number; spoken?: boolean }) {
  const [done, setDone] = useState(0);
  if (!items.length) return null;
  const all = done >= items.length;
  return (
    <section className="grid gap-4">
      <div className="relative overflow-hidden rounded-[2rem] bg-ink p-6 text-bg md:p-8">
        <Seal size={40} weight="duotone" className="text-fire" />
        <h2 className="display mt-3 text-2xl font-bold">Контракт на балл {target.toFixed(1)}</h2>
        <p className="mt-2 max-w-[52ch] opacity-80">
          Между тобой и {target.toFixed(1)} {items.length === 1 ? "одно исправление" : `${items.length} исправления`}{spoken ? " вслух" : ""}. Это ошибки, которые чаще всего стоят баллов. Исправь каждую сам(а), так они закрепятся.
        </p>
        <p className="mt-4 text-sm font-bold">{done} из {items.length} готово</p>
      </div>
      <ol className="grid gap-3">
        {items.map((it, i) => <Item key={it.rule + i} item={it} n={i + 1} spoken={spoken} onDone={() => setDone((d) => d + 1)} />)}
      </ol>
      {all && (
        <p className="rounded-3xl bg-ok-soft p-5 font-semibold text-ok">Контракт выполнен. Подтверди результат в следующем {spoken ? "ответе" : "эссе"}.</p>
      )}
    </section>
  );
}
