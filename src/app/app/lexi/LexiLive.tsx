"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ChatCircleText, Keyboard, MicrophoneSlash, PaperPlaneRight, PhoneDisconnect, Subtitles, SubtitlesSlash, Waveform } from "@phosphor-icons/react";
import { FireSpirit } from "@/components/fx/FireSpirit";
import type { FaceDriver, FaceMode } from "@/components/fx/LexiFace";
import { Mascot } from "@/components/ui/Mascot";
import { MIC_ERRORS, type MicError } from "@/components/app/voice-client";
import { connectLive, type LiveEvent, type LiveLink } from "@/components/app/live-client";
import { useCalm } from "@/lib/motion-pref";
import { isMood, type Mood } from "@/lib/voices";
import type { CallSetup } from "./LexiCall";

// The live call: the student and Lexi talk in real time (Gemini Live through ai/live.py).
// Lexi hears the student herself and decides when they have finished, answers within about a
// second, and stops the moment she is talked over. If the live service is not there, the page
// falls back to the step-by-step call (onFallback).

type Fix = { wrong: string; right: string; why: string };
type Line = { role: "lexi" | "user"; text: string; fix?: Fix | null; typed?: boolean };
type Stage = "connecting" | "live" | "ending";

function Highlighted({ text, fix }: { text: string; fix?: Fix | null }) {
  if (!fix) return <>{text}</>;
  const i = text.toLowerCase().indexOf(fix.wrong.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="underline decoration-bad decoration-wavy decoration-2 underline-offset-4">{text.slice(i, i + fix.wrong.length)}</span>{" "}
      <span className="rounded-md bg-ok-soft px-1.5 py-0.5 font-semibold text-ok">{fix.right}</span>
      {text.slice(i + fix.wrong.length)}
    </>
  );
}

function micError(e: unknown): MicError {
  const name = (e as DOMException)?.name;
  return name === "NotFoundError" ? "missing" : name === "NotReadableError" ? "busy" : name === "NotAllowedError" ? "denied" : "unsupported";
}

export function LexiLive({ setup, title, onLimit, onFallback }: { setup: CallSetup; title: string; onLimit: () => void; onFallback: () => void }) {
  const router = useRouter();
  const calm = useCalm();
  const [stage, setStageState] = useState<Stage>("connecting");
  const [lines, setLinesState] = useState<Line[]>([]);
  const [caption, setCaption] = useState("");
  const [heard, setHeard] = useState("");
  const [subtitles, setSubtitles] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState<MicError | null>(null);
  const [muted, setMuted] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const [typed, setTyped] = useState("");
  const [, setTick] = useState(0);

  const stageRef = useRef<Stage>("connecting");
  const linesRef = useRef<Line[]>([]);
  const link = useRef<LiveLink | null>(null);
  const conv = useRef<string | null>(null);
  const moodRef = useRef<Mood>("warm");
  const femaleRef = useRef(true);
  const heardAt = useRef(0); // when the student's words last came in
  const goodbye = useRef(false);
  const leaving = useRef(false);

  const go = (s: Stage) => { stageRef.current = s; setStageState(s); };
  const setLines = (next: Line[]) => { linesRef.current = next; setLinesState(next); };

  // what Lexi is doing, for the face and the status line
  const mode = (): FaceMode => {
    const l = link.current;
    if (stageRef.current === "connecting") return "thinking";
    if (l?.playing()) return "speaking";
    if (Date.now() - heardAt.current < 1500) return "thinking";
    return l && l.mic() > 0.08 ? "hearing" : "idle";
  };

  const driver = useMemo<FaceDriver>(() => ({
    mood: () => moodRef.current,
    mode,
    voice: () => link.current?.voice() ?? { level: 0, bright: 0.5, playing: false, analysed: false },
    hear: () => link.current?.mic() ?? 0,
    persona: () => setup.persona,
    female: () => femaleRef.current,
    speech: () => null,
  }), [setup.persona]);

  /** Hangs up and opens the review once the transcript is stored. */
  const finish = useCallback(async () => {
    if (leaving.current) return;
    leaving.current = true;
    go("ending");
    await link.current?.end();
    link.current = null;
    router.push(conv.current ? `/app/lexi/${conv.current}` : "/app/lexi");
  }, [router]);

  const onEvent = useCallback((e: LiveEvent) => {
    switch (e.t) {
      case "ready":
        if (stageRef.current === "connecting") go("live");
        setNotice("");
        break;
      case "reconnecting":
        setNotice("Связь прервалась, восстанавливаю…");
        break;
      case "mood":
        if (isMood(e.mood)) moodRef.current = e.mood;
        break;
      case "say":
        setCaption(e.text as string);
        break;
      case "heard":
        heardAt.current = Date.now();
        setHeard(e.text as string);
        break;
      case "interrupted":
        link.current?.hush();
        break;
      case "fix": {
        // a spoken answer gets it with its "turn"; a typed one is already in the list
        const fix = e.fix as Fix;
        const last = [...linesRef.current].reverse().findIndex((l) => l.role === "user");
        if (last >= 0) {
          const i = linesRef.current.length - 1 - last;
          setLines(linesRef.current.map((l, j) => (j === i && l.text.toLowerCase().includes(fix.wrong.toLowerCase()) ? { ...l, fix } : l)));
        }
        break;
      }
      case "turn": {
        const next = [...linesRef.current];
        if (e.heard) next.push({ role: "user", text: e.heard as string, fix: (e.fix as Fix | null) ?? null });
        if (e.said) next.push({ role: "lexi", text: e.said as string });
        setLines(next);
        setHeard("");
        break;
      }
      case "end":
        goodbye.current = true;
        break;
      case "error":
        setNotice("Lexi пропала со связи. Звонок сохранён, разбор уже пишется.");
        void finish();
        break;
    }
  }, [finish]);

  // ---------- start ----------
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const res = await fetch("/api/live", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ start: setup }) }).catch(() => null);
      if (res?.status === 429) return onLimit();
      if (!res?.ok) return onFallback();
      const s = (await res.json()) as { conv: string; token: string; female: boolean };
      conv.current = s.conv;
      femaleRef.current = s.female;
      try {
        link.current = await connectLive({
          token: s.token,
          onEvent,
          onDrop: () => {
            if (leaving.current) return;
            setNotice("Связь прервалась. Звонок сохранён.");
            void finish();
          },
        });
      } catch (e) {
        if (e instanceof DOMException && ["NotAllowedError", "NotFoundError", "NotReadableError"].includes(e.name)) {
          setError(micError(e));
          go("live");
          return;
        }
        return onFallback();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The status line follows Lexi's voice; and once she has said goodbye and finished, hang up
  useEffect(() => {
    const t = setInterval(() => {
      setTick((n) => n + 1);
      if (goodbye.current && !link.current?.playing() && stageRef.current === "live") void finish();
    }, 250);
    return () => clearInterval(t);
  }, [finish]);

  // Closing the tab hangs up too, so the transcript is stored and the review written
  useEffect(() => {
    const bye = () => link.current?.close();
    addEventListener("pagehide", bye);
    return () => {
      removeEventListener("pagehide", bye);
      if (!leaving.current) link.current?.close();
    };
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    link.current?.setMuted(next);
  };

  const submitTyped = (e: React.FormEvent) => {
    e.preventDefault();
    const text = typed.trim();
    if (!text || !link.current || stageRef.current !== "live") return;
    link.current.hush();
    link.current.sendText(text);
    setLines([...linesRef.current, { role: "user", text, typed: true }]);
    setTyped("");
  };

  const m = mode();
  const status =
    stage === "connecting" ? "Звоню Lexi…"
    : stage === "ending" ? "Lexi пишет разбор…"
    : m === "speaking" ? "Lexi говорит… можно перебить"
    : m === "thinking" ? "Lexi думает…"
    : muted ? "Микрофон выключен"
    : m === "hearing" ? "Слушаю…"
    : "Говори, я слушаю";
  const lastUser = [...lines].reverse().find((l) => l.role === "user");

  return (
    <div className="grid gap-6">
      <div className="relative rounded-[2.5rem] bg-[#140f24] px-4 pb-6 pt-5 text-white shadow-[0_40px_80px_-40px_rgb(27_20_51/0.9)] sm:px-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2.5rem]">
          <div className="absolute left-1/2 top-[8%] size-[520px] -translate-x-1/2 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(closest-side, rgb(255 106 43 / 0.55), transparent)" }} />
        </div>
        <div className="relative flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">Lexi · {title}</p>
            <p className="flex items-center gap-1.5 text-xs text-white/60">
              <span className={`size-1.5 rounded-full ${stage === "connecting" ? "bg-white/40" : "animate-pulse bg-[#3dd68c]"}`} /> {stage === "connecting" ? "соединение" : stage === "ending" ? "звонок завершён" : "на связи"}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSubtitles((s) => !s)} className="grid size-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20" aria-pressed={subtitles} aria-label={subtitles ? "Скрыть субтитры" : "Показать субтитры"}>
              {subtitles ? <SubtitlesSlash size={18} /> : <Subtitles size={18} />}
            </button>
            <button onClick={finish} disabled={stage === "ending"} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#e5484d] px-4 text-sm font-bold transition hover:brightness-110 disabled:opacity-50">
              <PhoneDisconnect size={18} weight="fill" /> <span className="hidden sm:inline">Завершить</span>
            </button>
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-10 w-[200px] sm:w-[250px]">
          <FireSpirit face={driver} talk={false} />
        </div>

        <p className="relative mt-1 text-center text-sm font-bold text-[#ffb27a]" aria-live="polite">{status}</p>

        <div className="relative mx-auto mt-3 min-h-[5.5rem] max-w-[56ch] text-center">
          {subtitles && caption && (
            <motion.p key={caption.slice(0, 24)} initial={{ opacity: 0, y: calm ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="text-lg leading-relaxed sm:text-xl">
              {caption}
            </motion.p>
          )}
          {subtitles && (heard || lastUser) && m !== "speaking" && (
            <p className="mt-2 text-sm text-white/60">Ты: {heard || <Highlighted text={lastUser!.text} fix={lastUser!.fix} />}</p>
          )}
        </div>

        <div className="relative mt-5 flex items-center justify-center gap-3">
          <button onClick={() => setKeyboard((k) => !k)} className={`grid size-12 place-items-center rounded-full transition ${keyboard ? "bg-white text-[#140f24]" : "bg-white/10 hover:bg-white/20"}`} aria-pressed={keyboard} aria-label="Написать ответ">
            <Keyboard size={22} />
          </button>
          <button
            onClick={toggleMute}
            className={`grid size-16 place-items-center rounded-full transition active:scale-95 ${muted ? "bg-white/15 text-white/70" : "bg-[#ff6a2b] text-[#1b1433]"}`}
            style={muted ? undefined : { boxShadow: "0 14px 30px -12px rgb(255 90 31 / 0.9)" }}
            aria-pressed={muted}
            aria-label={muted ? "Включить микрофон" : "Выключить микрофон"}
          >
            {muted ? <MicrophoneSlash size={28} weight="fill" /> : <Waveform size={28} weight="bold" />}
          </button>
        </div>
        <p className="relative mt-3 text-center text-xs text-white/50">
          Просто говори, как по телефону. Lexi ответит, когда ты договоришь, и замолчит, если её перебить.
        </p>

        <AnimatePresence>
          {keyboard && (
            <motion.form
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              onSubmit={submitTyped}
              className="relative mx-auto mt-4 flex max-w-xl gap-2 overflow-hidden"
            >
              <label htmlFor="lexi-typed" className="sr-only">Ответ текстом</label>
              <input id="lexi-typed" value={typed} onChange={(e) => setTyped(e.target.value)} maxLength={800} autoComplete="off"
                placeholder={setup.lang === "en" ? "Type in English…" : "Напиши ответ (лучше по-английски)…"}
                className="h-12 flex-1 rounded-full border border-white/15 bg-white/10 px-5 text-white placeholder:text-white/40 focus:border-[#ff8a3d] focus:outline-none" />
              <button className="grid size-12 place-items-center rounded-full bg-[#ff6a2b] text-[#1b1433]" aria-label="Отправить"><PaperPlaneRight size={20} weight="fill" /></button>
            </motion.form>
          )}
        </AnimatePresence>

        {(notice || error) && (
          <p role="alert" className="relative mt-3 text-center text-sm font-semibold text-[#ff9a9a]">{error ? MIC_ERRORS[error] : notice}</p>
        )}
      </div>

      <section aria-label="Расшифровка" className="card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-bold"><ChatCircleText size={20} /> Расшифровка</h2>
        {lines.length ? (
          <ol className="mt-4 grid gap-3">
            {lines.map((l, i) => (
              <li key={i} className={`flex max-w-[88%] gap-2 ${l.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
                {l.role === "lexi" && <Mascot className="mt-1 w-6 shrink-0" />}
                <span className={`rounded-3xl px-4 py-3 text-[15px] leading-relaxed ${l.role === "lexi" ? "bg-surface-2" : "bg-fire-soft"}`}>
                  <Highlighted text={l.text} fix={l.fix} />
                  {l.fix?.why && <span className="mt-2 block text-xs text-muted">{l.fix.why}</span>}
                  {l.typed && <span className="mt-1 block text-[11px] text-muted">написано</span>}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-muted">Здесь появится ваш разговор.</p>
        )}
        {stage === "ending" && conv.current && (
          <p className="mt-4 text-sm text-muted">Звонок завершён. <Link href={`/app/lexi/${conv.current}`} className="font-semibold text-fire-text underline underline-offset-4">Открыть разбор</Link></p>
        )}
      </section>
    </div>
  );
}
