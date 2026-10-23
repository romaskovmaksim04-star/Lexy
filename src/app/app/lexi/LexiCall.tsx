"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUp, ChatCircleText, Hand, Keyboard, Microphone, MicrophoneSlash, PaperPlaneRight, PhoneDisconnect, Subtitles, SubtitlesSlash, Waveform,
} from "@phosphor-icons/react";
import { FireSpirit } from "@/components/fx/FireSpirit";
import type { FaceDriver, FaceMode } from "@/components/fx/LexiFace";
import { Mascot } from "@/components/ui/Mascot";
import { MIC_ERRORS, playVoice, preloadVoice, speechNow, stopVoice, transcribe, unlockAudio, useRecorder, voiceLevel, type Recording } from "@/components/app/voice-client";
import { useVoiceCall } from "@/components/app/voice-call";
import { preppyEnd } from "@/app/actions";
import { useCalm } from "@/lib/motion-pref";
import type { Mood } from "@/lib/voices";

// The call itself: the student talks, Lexi answers with her face and her voice.
//
// Turn-taking: an utterance ends after a second of silence and is transcribed at once. If
// the student starts talking again before Lexi's answer has begun to play, the request is
// cancelled and the pieces go together, so a thinking pause never cuts an answer in two.
// Two counters keep stale work out: `req` for requests (a cancelled one is ignored) and
// `audio` for playback (talking over Lexi silences the rest of her line, but the line
// itself still lands in the transcript).

export type CallSetup = {
  persona: string;
  topic: string;
  topicTitle?: string;
  voice: string;
  lang: "mix" | "en";
  swear: boolean;
};

type Fix = { wrong: string; right: string; why: string };
type Line = { role: "lexi" | "user"; text: string; fix?: Fix | null; typed?: boolean };
type Stage = "connecting" | "idle" | "sending" | "replying" | "ending";
// alts: the recogniser's other reading of each piece ("" when both agree)
type Pending = { texts: string[]; alts?: string[]; seconds: number; pauses: number; typed: boolean; at?: number[] };

// Words a thought is rarely finished on: wait a little longer before answering
const INCOMPLETE = /(\b(and|but|because|so|or|the|a|an|to|of|in|on|at|with|my|your|we|um+|uh+|er+|like|that|which|when|if|is|was|и|а|но|потому|что|ну|короче|в|на|с|это|типа)|,|\.\.\.|…|-)\s*$/i;
const EMPTY: Pending = { texts: [], seconds: 0, pauses: 0, typed: false };

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

async function readStream(res: Response, on: (e: Record<string, unknown>) => void) {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      let e: Record<string, unknown>;
      try { e = JSON.parse(line); } catch { continue; }
      on(e);
    }
  }
}

export function LexiCall({ setup, title, onLimit }: { setup: CallSetup; title: string; onLimit: () => void }) {
  const router = useRouter();
  const calm = useCalm();
  const [stage, setStageState] = useState<Stage>("connecting");
  const [lines, setLinesState] = useState<Line[]>([]);
  const [caption, setCaption] = useState("");
  const [subtitles, setSubtitles] = useState(true);
  const [notice, setNotice] = useState("");
  const [hands, setHands] = useState(true);
  const [muted, setMuted] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const [typed, setTyped] = useState("");
  const [nudged, setNudged] = useState(false);
  const [female, setFemale] = useState(true);
  const [ptt, setPtt] = useState<"idle" | "opening" | "listening">("idle");

  const stageRef = useRef<Stage>("connecting");
  const linesRef = useRef<Line[]>([]);
  const conv = useRef<string | null>(null);
  const moodRef = useRef<Mood>("warm");
  const femaleRef = useRef(true);
  const modeRef = useRef<FaceMode>("thinking");
  const fillers = useRef<string[]>([]);
  const nudgeUrls = useRef<string[]>([]);
  const lastLexi = useRef("");
  const interrupted = useRef(false);
  const finished = useRef(false);
  const pending = useRef<Pending>({ ...EMPTY });
  const sent = useRef<(Pending & { index: number }) | null>(null);
  const sttInFlight = useRef(0);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const forceSend = useRef(false);
  const request = useRef<AbortController | null>(null);
  const req = useRef(0);
  const audio = useRef(0);
  const queue = useRef<string[]>([]);
  // where the feeling changes inside each queued clip
  const clipMoods = useRef(new Map<string, [number, string][]>());
  const playing = useRef(false);
  const streamDone = useRef(true);
  const finalLine = useRef(false);
  const fillerAt = useRef(0);
  const callState = useRef("off");

  const go = (s: Stage) => { stageRef.current = s; setStageState(s); };
  const setLines = (next: Line[]) => { linesRef.current = next; setLinesState(next); };
  const pushLine = (line: Line) => { setLines([...linesRef.current, line]); return linesRef.current.length - 1; };

  // ---------- microphone ----------
  const heard = useRef<(r: Recording, pauses: number) => void>(() => {});
  const speechStart = useRef<() => void>(() => {});
  const bargeIn = useRef<() => void>(() => {});
  const call = useVoiceCall({
    onUtterance: (u) => heard.current({ blob: u.wav, seconds: u.seconds, caption: "" }, u.pauses),
    onSpeechStart: (b) => { if (!b) speechStart.current(); },
    onBargeIn: () => bargeIn.current(),
  });
  callState.current = call.state;
  const mic = useRecorder();
  const hearLevel = useRef(call.level);
  hearLevel.current = hands ? call.level : mic.level;

  // The face reads everything through this, every frame
  const driver = useMemo<FaceDriver>(() => ({
    mood: () => moodRef.current,
    mode: () => modeRef.current,
    voice: () => voiceLevel(),
    hear: () => hearLevel.current.get(),
    persona: () => setup.persona,
    female: () => femaleRef.current,
    speech: () => speechNow(),
  }), [setup.persona]);

  const listening = hands ? call.state === "hearing" : ptt === "listening";
  useEffect(() => {
    modeRef.current = stage === "replying" ? "speaking" : stage === "sending" || stage === "connecting" ? "thinking" : listening ? "hearing" : "idle";
  }, [stage, listening]);

  // ---------- Lexi's voice ----------
  const lexiDone = useCallback(() => {
    call.setSpeaking(false);
    if (finalLine.current) {
      finished.current = true;
      go("ending");
      call.stop();
      setTimeout(() => router.push(`/app/lexi/${conv.current}`), 900);
      return;
    }
    if (stageRef.current === "replying" || stageRef.current === "connecting") go("idle");
  }, [call, router]);

  const pump = useCallback(async (my: number) => {
    if (playing.current) return;
    playing.current = true;
    while (queue.current.length && my === audio.current) {
      const url = queue.current.shift()!;
      queue.current.forEach(preloadVoice);
      if (stageRef.current !== "replying") {
        go("replying");
        // Lexi starts a new line: anything said before it and never sent is stale now
        // (what the student says over her from here on is kept, as interrupting)
        pending.current = { texts: [], seconds: 0, pauses: 0, typed: false, at: [] };
      }
      call.setSpeaking(true);
      await playVoice(url, undefined, { moods: clipMoods.current.get(url) });
      clipMoods.current.delete(url);
    }
    playing.current = false;
    if (my === audio.current && streamDone.current && !queue.current.length) lexiDone();
  }, [call, lexiDone]);

  /** Silences Lexi: the rest of her line is not played (it stays in the transcript). */
  const silenceLexi = () => {
    audio.current++;
    queue.current = [];
    stopVoice();
    call.setSpeaking(false);
  };

  // ---------- one line of Lexi, streamed ----------
  const run = useCallback(async (body: Record<string, unknown>, userIndex: number | null) => {
    const ctl = new AbortController();
    request.current = ctl;
    const my = ++req.current;
    const myAudio = ++audio.current;
    streamDone.current = false;
    finalLine.current = false;
    queue.current = [];
    setCaption("");
    let said = "";
    try {
      const res = await fetch("/api/lexi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctl.signal });
      if (res.status === 429) {
        finished.current = true;
        onLimit();
        return;
      }
      if (!res.ok || !res.body) throw new Error(String(res.status));
      await readStream(res, (e) => {
        if (my !== req.current) return;
        switch (e.t) {
          case "call":
            conv.current = e.id as string;
            setFemale(e.female !== false);
            femaleRef.current = e.female !== false;
            fillers.current = (e.fillers as string[]) ?? [];
            nudgeUrls.current = (e.nudge as string[]) ?? [];
            fillers.current.forEach(preloadVoice);
            break;
          case "mood":
            moodRef.current = e.mood as Mood;
            break;
          case "say":
            said = e.text as string;
            setCaption(said);
            break;
          case "audio":
            if (myAudio !== audio.current) break; // the student talked over this line
            sent.current = null; // Lexi answers: the student's line has gone through
            queue.current.push(e.url as string);
            if (Array.isArray(e.moods) && e.moods.length) clipMoods.current.set(e.url as string, e.moods as [number, string][]);
            preloadVoice(e.url as string);
            pump(myAudio);
            break;
          case "end":
            if (e.mood) moodRef.current = e.mood as Mood;
            if (userIndex !== null && e.fix) setLines(linesRef.current.map((x, i) => (i === userIndex ? { ...x, fix: e.fix as Fix } : x)));
            finalLine.current = !!e.final;
            break;
          case "error":
            throw new Error("server");
        }
      });
      if (my !== req.current) return;
      sent.current = null;
      lastLexi.current = said;
      if (said) pushLine({ role: "lexi", text: said });
      streamDone.current = true;
      if (myAudio !== audio.current) {
        // Lexi was interrupted: if that was her goodbye, the call still ends
        if (finalLine.current) lexiDone();
      } else if (!playing.current && !queue.current.length) lexiDone();
    } catch (err) {
      if ((err as Error).name === "AbortError" || my !== req.current) return; // the student kept talking
      sent.current = null;
      streamDone.current = true;
      setNotice("Связь прервалась. Скажи ещё раз.");
      call.setSpeaking(false);
      go("idle");
    } finally {
      if (request.current === ctl) request.current = null;
    }
  }, [call, lexiDone, onLimit, pump]);

  // ---------- the student's answer ----------
  const send = useCallback(() => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    forceSend.current = false;
    const p = pending.current;
    const text = p.texts.join(" ").replace(/\s+/g, " ").trim();
    if (!text || !conv.current || finished.current) return;
    setNotice("");
    go("sending");
    // A short "hmm" while the answer is being written, often but not every time
    if (!p.typed && fillers.current.length && Math.random() < 0.7 && Date.now() - fillerAt.current > 12_000) {
      fillerAt.current = Date.now();
      call.setSpeaking(true);
      playVoice(fillers.current[Math.floor(Math.random() * fillers.current.length)]).then(() => {
        if (stageRef.current === "sending") call.setSpeaking(false);
      });
    }
    const index = pushLine({ role: "user", text, typed: p.typed });
    const was = interrupted.current;
    interrupted.current = false;
    sent.current = { ...p, index };
    pending.current = { ...EMPTY, texts: [] };
    // where the recogniser was unsure, Lexi also gets its other reading of the same words
    const alt = p.alts?.some(Boolean) ? p.texts.map((t, i) => p.alts?.[i] || t).join(" ").replace(/\s+/g, " ").trim() : undefined;
    void run({ turn: { id: conv.current, text, alt, seconds: p.seconds, pauses: p.pauses, typed: p.typed, interrupted: was } }, index);
  }, [call, run]);

  const settle = useCallback(() => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    const last = pending.current.texts[pending.current.texts.length - 1] ?? "";
    settleTimer.current = setTimeout(send, forceSend.current ? 0 : INCOMPLETE.test(last) ? 1200 : 200);
  }, [send]);

  /** The student is talking again before Lexi answered: take the answer back and wait. */
  const takeBack = () => {
    const back = sent.current;
    if (stageRef.current !== "sending" || !back) return;
    request.current?.abort();
    req.current++;
    silenceLexi();
    sent.current = null;
    pending.current = {
      texts: [...back.texts, ...pending.current.texts],
      alts: [...(back.alts ?? back.texts.map(() => "")), ...(pending.current.alts ?? pending.current.texts.map(() => ""))],
      seconds: back.seconds + pending.current.seconds,
      pauses: back.pauses + pending.current.pauses + 1,
      typed: false,
    };
    setLines(linesRef.current.filter((_, i) => i !== back.index));
    go("idle");
  };

  speechStart.current = () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    setNudged(false);
    takeBack();
  };

  bargeIn.current = () => {
    setNudged(false);
    if (stageRef.current === "sending") return takeBack(); // only the "hmm" was playing
    if (stageRef.current === "replying") {
      silenceLexi();
      interrupted.current = true;
      go("idle");
    }
  };

  heard.current = async (rec, pauses) => {
    if (muted || finished.current || !conv.current) return;
    sttInFlight.current++;
    const r = await transcribe(rec, "chat", lastLexi.current);
    sttInFlight.current--;
    const text = r.text.trim();
    if (text) {
      const p = pending.current;
      const now = Date.now();
      // a piece heard long after the last one starts a new answer
      if (p.at?.length && now - p.at[p.at.length - 1] > 20_000) {
        p.texts = [];
        p.alts = [];
        p.at = [];
        p.seconds = 0;
        p.pauses = 0;
      }
      p.alts = [...(p.alts ?? p.texts.map(() => "")), r.alt?.trim() ?? ""];
      p.texts.push(text);
      p.at = [...(p.at ?? []), now];
      p.seconds += r.speech ?? rec.seconds;
      p.pauses += pauses;
    } else if (rec.seconds > 1.2 && !pending.current.texts.length) {
      setNotice(female ? "Lexi не расслышала, повтори, пожалуйста." : "Lexi не расслышал, повтори, пожалуйста.");
    }
    if (!sttInFlight.current && pending.current.texts.length && callState.current !== "hearing" && stageRef.current === "idle") settle();
  };

  const interruptForInput = () => {
    if (stageRef.current === "replying") {
      silenceLexi();
      interrupted.current = true;
      go("idle");
    }
  };

  // Push-to-talk answers go the same way
  const pttStart = async () => {
    if (ptt !== "idle" || stageRef.current === "sending" || stageRef.current === "connecting") return;
    interruptForInput();
    setPtt("opening");
    if (await mic.start()) setPtt("listening");
    else setPtt("idle");
  };
  const pttSend = async () => {
    const rec = await mic.stop();
    setPtt("idle");
    if (!rec || rec.seconds < 0.6) return;
    const r = await transcribe(rec, "chat", lastLexi.current);
    if (!r.text.trim()) {
      setNotice(female ? "Lexi не расслышала, повтори, пожалуйста." : "Lexi не расслышал, повтори, пожалуйста.");
      return;
    }
    pending.current = { texts: [r.text.trim()], alts: [r.alt?.trim() ?? ""], seconds: r.speech ?? rec.seconds, pauses: 0, typed: false };
    send();
  };

  const submitTyped = (e: React.FormEvent) => {
    e.preventDefault();
    const text = typed.trim();
    if (!text || stageRef.current === "sending" || stageRef.current === "connecting" || stageRef.current === "ending") return;
    interruptForInput();
    setTyped("");
    pending.current = { texts: [text], seconds: 0, pauses: 0, typed: true };
    send();
  };

  const doneTalking = () => {
    forceSend.current = true;
    if (callState.current === "hearing") call.finishNow();
    else if (pending.current.texts.length && stageRef.current === "idle") settle();
  };

  // ---------- start, silence, end ----------
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      unlockAudio();
      if (!(await call.start())) setHands(false);
      await run({ start: setup }, null);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nobody heard for 15 seconds on the student's turn: Lexi says so and the screen explains why
  useEffect(() => {
    if (!hands || muted || stage !== "idle" || nudged || call.silentFor < 15 || pending.current.texts.length) return;
    setNudged(true);
    call.setSpeaking(true);
    (async () => {
      for (const url of nudgeUrls.current) await playVoice(url);
      if (stageRef.current === "idle") call.setSpeaking(false);
    })();
  }, [hands, muted, stage, nudged, call]);

  const end = useCallback(async () => {
    finished.current = true;
    request.current?.abort();
    req.current++;
    silenceLexi();
    call.stop();
    go("ending");
    const id = conv.current;
    if (!id) return router.push("/app/lexi");
    await preppyEnd(id);
    router.push(`/app/lexi/${id}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call, router]);

  // Closing the tab still ends the call, so the review gets written
  useEffect(() => {
    const bye = () => {
      if (conv.current && !finished.current) {
        finished.current = true;
        navigator.sendBeacon("/api/lexi", new Blob([JSON.stringify({ end: { id: conv.current } })], { type: "application/json" }));
      }
    };
    addEventListener("pagehide", bye);
    return () => {
      removeEventListener("pagehide", bye);
      stopVoice();
      bye();
    };
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    call.setPaused(next);
    setNudged(false);
  };

  const switchMode = async () => {
    stopVoice();
    if (hands) {
      call.stop();
      setHands(false);
    } else if (await call.start()) {
      setHands(true);
    }
    setNudged(false);
  };

  const status =
    stage === "connecting" ? "Звоню Lexi…"
    : stage === "ending" ? "Lexi пишет разбор…"
    : stage === "sending" ? "Lexi думает…"
    : stage === "replying" ? (hands ? "Lexi говорит… можно перебить" : "Lexi говорит…")
    : muted ? "Микрофон выключен"
    : listening ? "Слушаю…"
    : hands ? "Говори, я слушаю" : "Твой ход";
  const lastUser = [...lines].reverse().find((l) => l.role === "user");

  return (
    <div className="grid gap-6">
      <div className="relative rounded-[2.5rem] bg-[#140f24] px-4 pb-6 pt-5 text-white shadow-[0_40px_80px_-40px_rgb(27_20_51/0.9)] sm:px-8">
        {/* the glow is clipped to the card on its own layer; the fire itself is never clipped */}
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
            <button onClick={end} disabled={stage === "ending"} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#e5484d] px-4 text-sm font-bold transition hover:brightness-110 disabled:opacity-50">
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
          {subtitles && lastUser && stage !== "replying" && (
            <p className="mt-2 text-sm text-white/60">Ты: <Highlighted text={lastUser.text} fix={lastUser.fix} /></p>
          )}
        </div>

        {nudged && stage === "idle" && !muted && hands && (
          <div role="alert" className="relative mx-auto mt-3 max-w-md rounded-3xl bg-white/10 p-4 text-sm">
            <p className="font-bold">Lexi тебя не слышит</p>
            {call.peak < 0.05 ? (
              <ul className="mt-2 grid list-disc gap-1 pl-5 text-white/75">
                <li>Микрофон молчит совсем. Проверь, что он не выключен кнопкой на гарнитуре или в настройках системы.</li>
                <li>Нажми на значок замка слева от адреса сайта: доступ к микрофону должен быть разрешён, выбран нужный микрофон.</li>
                <li>Закрой Discord, Zoom и другие программы, которые могут держать микрофон, и обнови страницу.</li>
              </ul>
            ) : (
              <ul className="mt-2 grid list-disc gap-1 pl-5 text-white/75">
                <li>Микрофон работает, но голос слишком тихий. Говори громче или ближе к микрофону.</li>
                <li>Если вокруг шумно, переключись на «Говорить по кнопке» или напиши ответ.</li>
              </ul>
            )}
            <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
              Уровень микрофона
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15"><span className="block h-full rounded-full bg-[#ff8a3d] transition-[width]" style={{ width: `${Math.round(call.peak * 100)}%` }} /></span>
            </div>
          </div>
        )}

        <div className="relative mt-5 flex items-center justify-center gap-3">
          <button onClick={() => setKeyboard((k) => !k)} className={`grid size-12 place-items-center rounded-full transition ${keyboard ? "bg-white text-[#140f24]" : "bg-white/10 hover:bg-white/20"}`} aria-pressed={keyboard} aria-label="Написать ответ">
            <Keyboard size={22} />
          </button>
          {hands ? (
            <>
              <button
                onClick={toggleMute}
                className={`grid size-16 place-items-center rounded-full transition active:scale-95 ${muted ? "bg-white/15 text-white/70" : "bg-[#ff6a2b] text-[#1b1433]"}`}
                style={muted ? undefined : { boxShadow: "0 14px 30px -12px rgb(255 90 31 / 0.9)" }}
                aria-pressed={muted}
                aria-label={muted ? "Включить микрофон" : "Выключить микрофон"}
              >
                {muted ? <MicrophoneSlash size={28} weight="fill" /> : <Waveform size={28} weight="bold" />}
              </button>
              <button
                onClick={doneTalking}
                disabled={!listening && !pending.current.texts.length}
                className="grid size-12 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 disabled:opacity-30"
                aria-label="Я закончил, ответь"
                title="Я закончил"
              >
                <ArrowUp size={22} weight="bold" />
              </button>
            </>
          ) : (
            <button
              onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); pttStart(); }}
              onPointerUp={() => ptt === "listening" && pttSend()}
              onPointerCancel={() => ptt === "listening" && pttSend()}
              disabled={stage === "sending" || stage === "connecting" || stage === "ending"}
              className={`grid size-16 touch-none select-none place-items-center rounded-full transition active:scale-95 disabled:opacity-40 ${ptt === "listening" ? "bg-white text-[#140f24]" : "bg-[#ff6a2b] text-[#1b1433]"}`}
              aria-label="Зажми и говори"
            >
              <Microphone size={28} weight="fill" />
            </button>
          )}
          <button onClick={switchMode} className="grid size-12 place-items-center rounded-full bg-white/10 transition hover:bg-white/20" aria-label={hands ? "Говорить по кнопке" : "Разговор без кнопки"} title={hands ? "Говорить по кнопке" : "Разговор без кнопки"}>
            {hands ? <Hand size={22} /> : <Waveform size={22} />}
          </button>
        </div>
        <p className="relative mt-3 text-center text-xs text-white/50">
          {hands ? "Просто говори. Замолчишь на секунду, и Lexi ответит; продолжишь, она подождёт." : "Зажми кнопку и говори, отпусти, чтобы отправить."}
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

        {(notice || call.error || mic.error) && (
          <p role="alert" className="relative mt-3 text-center text-sm font-semibold text-[#ff9a9a]">{call.error ? MIC_ERRORS[call.error] : mic.error ? MIC_ERRORS[mic.error] : notice}</p>
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
