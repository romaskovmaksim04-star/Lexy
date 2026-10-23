"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue } from "motion/react";
import { ArrowRight, Microphone, Stop } from "@phosphor-icons/react";
import { FireSpirit } from "@/components/fx/FireSpirit";
import { kickEmbers } from "./EmberSky";

// The landing's stage: say something in English and the flame grows with your voice;
// where the browser can recognise speech, your words float above it. The sound is
// measured in the browser only, nothing is sent anywhere.

type Rec = { lang: string; continuous: boolean; interimResults: boolean; start(): void; stop(): void; abort(): void; onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null; onerror: (() => void) | null };

export function VoiceStage({ signedIn }: { signedIn: boolean }) {
  const level = useMotionValue(0);
  const [on, setOn] = useState(false);
  const [error, setError] = useState("");
  const [words, setWords] = useState<string[]>([]);
  const [said, setSaid] = useState(0);
  const stop = useRef<() => void>(() => {});

  useEffect(() => () => stop.current(), []);

  const start = async () => {
    setError("");
    setWords([]);
    setSaid(0);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      setError("Нужен доступ к микрофону. Разреши его в браузере и попробуй снова.");
      return;
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const an = ctx.createAnalyser();
    an.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(an);
    const buf = new Uint8Array(an.fftSize);
    let raf = 0;
    let loud = 0;
    const tick = () => {
      an.getByteTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += ((v - 128) / 128) ** 2;
      const l = Math.min(1, Math.sqrt(sum / buf.length) * 5);
      level.set(l);
      // A burst of loud speech throws embers into the sky behind the page
      if (l > 0.55 && performance.now() - loud > 900) { loud = performance.now(); kickEmbers(0.5); }
      raf = requestAnimationFrame(tick);
    };
    tick();

    const W = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    let rec: Rec | null = null;
    if (Ctor) {
      rec = new Ctor();
      rec.lang = "en-US";
      rec.continuous = true;
      rec.interimResults = true;
      let finals: string[] = [];
      rec.onresult = (e) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finals = [...finals, ...r[0].transcript.trim().split(/\s+/)];
          else interim += r[0].transcript;
        }
        const all = [...finals, ...interim.trim().split(/\s+/).filter(Boolean)];
        setWords(all.slice(-9));
        setSaid(finals.length);
      };
      rec.onerror = () => {};
      try { rec.start(); } catch { rec = null; }
    }

    stop.current = () => {
      cancelAnimationFrame(raf);
      stream.getTracks().forEach((t) => t.stop());
      ctx.close().catch(() => {});
      try { rec?.stop(); } catch { /* already stopped */ }
      level.set(0);
      setOn(false);
    };
    setOn(true);
  };

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-ink text-bg">
      <div aria-hidden className="halo pointer-events-none absolute left-1/2 top-[38%] size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl" style={{ background: "radial-gradient(closest-side, rgb(255 106 43 / 0.55), rgb(255 154 10 / 0.12) 60%, transparent)" }} />
      <div className="relative grid min-h-[600px] grid-rows-[1fr_auto] p-6 sm:p-10 lg:min-h-[640px] lg:p-14">
        <div className="relative mx-auto flex w-full max-w-[300px] flex-col items-center justify-end">
          <div className="pointer-events-none absolute inset-x-[-140px] top-2 flex min-h-[3.5rem] flex-wrap justify-center gap-x-2 gap-y-1" aria-live="polite">
            <AnimatePresence initial={false}>
              {words.map((w, i) => (
                <motion.span
                  key={`${i}-${w}`}
                  initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="display text-xl font-bold text-[#ffd9a8] sm:text-2xl"
                >
                  {w}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
          <FireSpirit level={level} talk={!on} className="w-[230px] sm:w-[270px]" />
        </div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="display max-w-[16ch] text-3xl font-bold leading-[1.05] md:text-5xl">Скажи что-нибудь по‑английски</h2>
            <p className="mt-4 max-w-[44ch] text-[16px] opacity-75">
              {on ? "Говори! Чем увереннее голос, тем выше пламя." : said > 0 ? `Ты сказал(а) ${said} слов. На экзамене так нужно говорить по две минуты подряд, без пауз.` : "Огонёк слушает: чем увереннее говоришь, тем выше пламя. Звук не уходит с твоего устройства."}
            </p>
            {error && <p role="alert" className="mt-3 text-sm font-semibold text-[#ff9a9a]">{error}</p>}
          </div>
          <div className="flex flex-wrap gap-3">
            {on ? (
              <button onClick={() => stop.current()} className="btn bg-bg text-ink"><Stop size={18} weight="fill" /> Остановить</button>
            ) : (
              <button onClick={start} className="btn btn-fire"><Microphone size={18} weight="fill" /> Включить микрофон</button>
            )}
            {!on && said > 0 && (
              <Link href={signedIn ? "/app/lexi" : "/quiz"} className="btn border border-white/20 text-bg hover:bg-white/10">Поговорить с Lexi <ArrowRight size={16} weight="bold" /></Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
