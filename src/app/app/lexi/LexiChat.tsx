"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { Mascot } from "@/components/ui/Mascot";
import { playVoice } from "@/components/app/voice-client";
import { readStream, type CallSetup } from "./LexiCall";

// Text chat with Lexi: the same conversation engine as the call (/api/lexi with typed turns),
// so corrections, characters and the review after the chat all work the same. The voice is
// off by default: an unplayed line is never synthesised, so a chat costs only the text model.

type Fix = { wrong: string; right: string; why: string };
type Msg = { role: "lexi" | "user"; text: string; fix?: Fix | null };

export function LexiChat({ setup, title, onLimit }: { setup: CallSetup; title: string; onLimit: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(true);
  const [voice, setVoice] = useState(false);
  const [ended, setEnded] = useState(false);
  const conv = useRef<string | null>(null);
  const voiceRef = useRef(false);
  const bottom = useRef<HTMLDivElement>(null);
  voiceRef.current = voice;

  useEffect(() => bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" }), [msgs]);

  const run = async (body: Record<string, unknown>, userIndex: number | null) => {
    setBusy(true);
    let said = "";
    const urls: string[] = [];
    setMsgs((m) => [...m, { role: "lexi", text: "…" }]);
    try {
      const res = await fetch("/api/lexi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.status === 429) { onLimit(); return; }
      if (!res.ok || !res.body) throw new Error(String(res.status));
      await readStream(res, (e) => {
        if (e.t === "call") conv.current = e.id as string;
        if (e.t === "say") { said = e.text as string; setMsgs((m) => [...m.slice(0, -1), { role: "lexi", text: said }]); }
        if (e.t === "audio") urls.push(e.url as string);
        if (e.t === "end") {
          if (userIndex !== null && e.fix) setMsgs((m) => m.map((x, i) => (i === userIndex ? { ...x, fix: e.fix as Fix } : x)));
          if (e.final) setEnded(true);
        }
        if (e.t === "error") throw new Error("server");
      });
      if (voiceRef.current) for (const u of urls) await playVoice(u);
    } catch {
      setMsgs((m) => [...m.slice(0, -1), { role: "lexi", text: said || "Связь оборвалась. Напиши ещё раз." }]);
    } finally {
      setBusy(false);
    }
  };

  // Lexi opens the chat
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run({ start: setup }, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = () => {
    const text = draft.trim();
    if (!text || busy || !conv.current) return;
    setDraft("");
    const index = msgs.length;
    setMsgs((m) => [...m, { role: "user", text }]);
    run({ turn: { id: conv.current, text, seconds: 0, typed: true } }, index);
  };

  const finish = async () => {
    if (conv.current) await fetch("/api/lexi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ end: { id: conv.current } }) }).catch(() => {});
    setEnded(true);
  };

  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <div className="flex items-center gap-3">
        <Mascot className="w-10" />
        <div className="min-w-0 flex-1"><p className="font-bold">Чат с Lexi</p><p className="text-sm text-muted">{title}</p></div>
        <button onClick={() => setVoice(!voice)} aria-pressed={voice} className="btn btn-ghost btn-sm" title="Озвучивать ответы">
          {voice ? <SpeakerHigh size={18} weight="fill" /> : <SpeakerSlash size={18} />} {voice ? "Голос вкл" : "Без голоса"}
        </button>
      </div>

      <div className="card grid min-h-[50dvh] content-start gap-3 p-4">
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[85%] ${m.role === "user" ? "justify-self-end" : "justify-self-start"}`}>
            <p className={`whitespace-pre-wrap rounded-3xl px-4 py-2.5 ${m.role === "user" ? "rounded-br-md bg-fire text-[#1b1433]" : "rounded-bl-md bg-surface-2"}`}>{m.text}</p>
            {m.fix && (
              <p className="mt-1 text-sm"><span className="rounded-md bg-bad-soft px-1.5 font-semibold text-bad line-through">{m.fix.wrong}</span> → <span className="rounded-md bg-ok-soft px-1.5 font-semibold text-ok">{m.fix.right}</span> <span className="text-muted">{m.fix.why}</span></p>
            )}
          </div>
        ))}
        <div ref={bottom} />
      </div>

      {ended ? (
        <div className="card grid gap-3 p-5 text-center">
          <p className="font-bold">Чат закончен. Разбор появится в «Последних разговорах» через несколько секунд.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {conv.current && <Link href={`/app/lexi/${conv.current}`} className="btn btn-fire">Открыть разбор</Link>}
            <Link href="/app/lexi" className="btn btn-ghost">Новый разговор</Link>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-2">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={1} maxLength={1000}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Напиши Lexi по-английски…" className="field min-h-12 flex-1 resize-none" />
          <button type="submit" disabled={busy || !draft.trim()} aria-label="Отправить" className="btn btn-fire size-12 shrink-0 justify-center p-0"><ArrowUp size={20} weight="bold" /></button>
          <button type="button" onClick={finish} disabled={busy} className="btn btn-ghost h-12 shrink-0">Закончить</button>
        </form>
      )}
    </div>
  );
}
