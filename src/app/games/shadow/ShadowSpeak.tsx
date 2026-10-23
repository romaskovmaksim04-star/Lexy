"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTransform, motion } from "motion/react";
import { ArrowCounterClockwise, ArrowRight, Microphone, SpeakerHigh, Trophy } from "@phosphor-icons/react";
import { MIC_ERRORS, playVoice, stopVoice, transcribe } from "@/components/app/voice-client";
import { useVoiceCall, type Utterance } from "@/components/app/voice-call";
import { matchWords, phraseScore } from "@/lib/games/score";

type Phrase = { text: string; audio: string; slow: string };
type Result = { hit: boolean[]; said: string; points: number; perfect: boolean };

export function ShadowSpeak({ phrases, signedIn }: { phrases: Phrase[]; signedIn: boolean }) {
  const [state, setState] = useState<"menu" | "play" | "over">("menu");
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<"listen" | "speak" | "check" | "done">("listen");
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState("");
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const iRef = useRef(i);
  iRef.current = i;

  const heard = async (u: Utterance) => {
    if (phaseRef.current !== "speak") return;
    call.setPaused(true);
    setPhase("check");
    const stt = await transcribe({ blob: u.wav, seconds: u.seconds, caption: "" }, "chat");
    const hit = matchWords(phrases[iRef.current].text, stt.text);
    const s = phraseScore(hit);
    setResults((r) => [...r, { hit, said: stt.text, points: s.points, perfect: s.perfect }]);
    setPhase("done");
  };
  const call = useVoiceCall({ onUtterance: (u) => { heard(u); } });
  const ring = useTransform(call.level, [0, 1], [1, 1.4]);

  const listen = async (index: number, slow = false) => {
    setPhase("listen");
    call.setPaused(true);
    await playVoice(slow ? phrases[index].slow : phrases[index].audio);
    setPhase("speak");
    call.setPaused(false);
  };

  const start = async () => {
    setError("");
    if (!(await call.start())) return;
    setResults([]);
    setI(0);
    setState("play");
    listen(0);
  };

  const next = () => {
    if (i + 1 >= phrases.length) {
      call.stop();
      setState("over");
      return;
    }
    setI(i + 1);
    listen(i + 1);
  };

  const retry = () => {
    setResults((r) => r.slice(0, -1));
    listen(i);
  };

  useEffect(() => () => { stopVoice(); }, []);
  useEffect(() => { if (call.error) setError(MIC_ERRORS[call.error]); }, [call.error]);

  if (state === "menu") {
    return (
      <div className="card mx-auto grid max-w-xl gap-6 p-6 text-center md:p-10">
        <span className="mx-auto grid size-16 place-items-center rounded-3xl text-white" style={{ background: "linear-gradient(150deg, #ff9a0a, #ff5a1f)" }}><Microphone size={32} weight="fill" /></span>
        <div>
          <h1 className="display text-3xl font-extrabold">Shadow Speak</h1>
          <p className="mt-2 text-muted">Слушаешь фразу носителя и сразу повторяешь вслух. Lexi подсвечивает слова, которые ты сказал(а) чётко, и те, что «проглотил(а)». Идеальная фраза даёт двойные очки.</p>
        </div>
        <p className="text-sm text-muted">{phrases.length} фраз. Говори, когда загорится микрофон, Lexi сама поймёт, когда ты закончил(а).</p>
        {signedIn ? (
          <button onClick={start} className="btn btn-fire mx-auto px-8 py-4 text-base"><Microphone size={18} weight="fill" /> Начать</button>
        ) : (
          <div className="grid gap-2">
            <Link href="/login?next=/games/shadow" className="btn btn-fire mx-auto px-8 py-4 text-base">Войти и играть</Link>
            <p className="text-xs text-muted">Чтобы Lexi могла распознать твою речь, нужен аккаунт. Это бесплатно.</p>
          </div>
        )}
        {error && <p role="alert" className="text-sm font-semibold text-bad">{error}</p>}
      </div>
    );
  }

  if (state === "over") {
    const total = results.reduce((a, r) => a + r.points, 0);
    const words = results.reduce((a, r) => a + r.hit.length, 0);
    const said = results.reduce((a, r) => a + r.hit.filter(Boolean).length, 0);
    return (
      <div className="card mx-auto grid max-w-xl gap-4 p-6 text-center md:p-10">
        <Trophy size={44} weight="fill" className="mx-auto text-fire" />
        <h1 className="display text-3xl font-extrabold">{total} очков</h1>
        <p className="text-muted">Точность {words ? Math.round((said / words) * 100) : 0}%, идеальных фраз: {results.filter((r) => r.perfect).length} из {results.length}.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={() => location.reload()} className="btn btn-fire"><ArrowCounterClockwise size={18} weight="bold" /> Новые фразы</button>
          <Link href="/app/lexi" className="btn btn-ghost">Поговорить с Lexi</Link>
        </div>
      </div>
    );
  }

  const p = phrases[i];
  const r = phase === "done" ? results[results.length - 1] : null;
  // Same tokens as the scorer, so every highlighted word lines up with its result
  const target = p.text.match(/[A-Za-z0-9'’]+/g) ?? [];
  return (
    <div className="mx-auto grid max-w-2xl gap-5">
      <div className="flex items-center justify-between text-sm font-bold">
        <span>Фраза {i + 1} из {phrases.length}</span>
        <span>Очки: <span className="display text-lg">{results.reduce((a, x) => a + x.points, 0)}</span></span>
      </div>
      <div className="card grid gap-6 p-6 text-center md:p-10">
        <p className="display text-2xl font-bold leading-snug md:text-3xl">
          {target.map((w, k) => (
            <span key={k} className={r ? (r.hit[k] ? "text-ok" : "text-bad underline decoration-wavy underline-offset-4") : ""}>{w} </span>
          ))}
        </p>
        <div className="relative mx-auto grid size-28 place-items-center">
          <motion.span aria-hidden className="absolute inset-0 rounded-full bg-fire/30" style={{ scale: phase === "speak" ? ring : 1, opacity: phase === "speak" ? 1 : 0 }} />
          <span className={`relative grid size-20 place-items-center rounded-full ${phase === "speak" ? "bg-fire text-[#1b1433]" : "bg-surface-2 text-muted"}`}>
            {phase === "listen" ? <SpeakerHigh size={34} weight="fill" className="animate-pulse" /> : <Microphone size={34} weight="fill" />}
          </span>
        </div>
        <p className="font-bold" aria-live="polite">
          {phase === "listen" ? "Слушай…" : phase === "speak" ? (call.state === "hearing" ? "Слышу тебя…" : "Повтори вслух") : phase === "check" ? "Проверяю…" : r?.perfect ? "Идеально! ×2" : `+${r?.points ?? 0}`}
        </p>
        {r && <p className="text-sm text-muted">Lexi услышала: «{r.said || "ничего"}»</p>}
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={() => listen(i, true)} disabled={phase === "listen" || phase === "check"} className="btn btn-ghost btn-sm"><SpeakerHigh size={16} /> Медленно</button>
          {phase === "done" && <button onClick={retry} className="btn btn-ghost btn-sm"><ArrowCounterClockwise size={16} /> Ещё раз</button>}
          {phase === "done" && <button onClick={next} className="btn btn-fire btn-sm">{i + 1 < phrases.length ? "Дальше" : "Итог"} <ArrowRight size={16} weight="bold" /></button>}
          {phase === "speak" && <button onClick={() => { call.setPaused(true); setResults((x) => [...x, { hit: target.map(() => false), said: "", points: 0, perfect: false }]); setPhase("done"); }} className="btn btn-ghost btn-sm">Пропустить</button>}
        </div>
      </div>
    </div>
  );
}
