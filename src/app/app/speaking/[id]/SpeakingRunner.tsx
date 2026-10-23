"use client";

import { useCalm } from "@/lib/motion-pref";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useTransform } from "motion/react";
import { ArrowRight, Eye, EyeSlash, Microphone, SpeakerHigh, Stop, X } from "@phosphor-icons/react";
import { Mascot } from "@/components/ui/Mascot";
import { MIC_ERRORS, playVoice, stopVoice, transcribe, useRecorder, type SttResult } from "@/components/app/voice-client";
import { submitSpeaking } from "@/app/actions";

type Q = { text: string; spoken: string; audio: string; slow: string };
type Phase = "intro" | "asking" | "prep" | "answer" | "processing" | "error";
type Part = { question: string; text: string; duration: number; words: SttResult["words"] };

const TIPS = [
  "Совет: в Part 2 пройди по всем пунктам карточки, это готовый план ответа.",
  "Факт: экзаменатор оценивает 4 критерия: Fluency, Lexical Resource, Grammar, Pronunciation.",
  "Совет: самокоррекция («I mean…») нормальна и показывает владение языком.",
  "Факт: паузы на размышление (well, let me think) естественны, если они не посреди фразы.",
  "Совет: в Part 3 развивай ответ: мнение, причина, пример, вывод.",
];

function clock(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;
}

export function SpeakingRunner({
  id, part, topic, prepSeconds, answerSeconds, questions,
}: { id: string; part: 1 | 2 | 3; topic: string; prepSeconds: number; answerSeconds: number; questions: Q[] }) {
  const router = useRouter();
  const reduce = useCalm();
  const mic = useRecorder();
  const [phase, setPhase] = useState<Phase>("intro");
  const [qi, setQi] = useState(0);
  const [left, setLeft] = useState(0);
  const [showText, setShowText] = useState(part === 2);
  const [slow, setSlow] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [tip, setTip] = useState(0);
  const pending = useRef<Promise<Part>[]>([]);
  const level = useTransform(mic.level, [0, 1], [1, 1.25]);

  const q = questions[qi];

  const ask = useCallback(async (index: number) => {
    setQi(index);
    setPhase("asking");
    const item = questions[index];
    await playVoice(slow ? item.slow : item.audio, item.spoken, { rate: slow ? 0.85 : 1 });
    if (part === 2 && prepSeconds > 0) {
      setLeft(prepSeconds);
      setPhase("prep");
    } else {
      setLeft(answerSeconds);
      setPhase("answer");
    }
  }, [questions, part, prepSeconds, answerSeconds, slow]);

  // Recording starts as soon as the answer phase begins
  useEffect(() => {
    if (phase !== "answer") return;
    let alive = true;
    mic.start().then((ok) => {
      if (!ok && alive) setPhase("error");
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, qi]);

  const next = useCallback(async () => {
    const rec = await mic.stop();
    if (rec) {
      const question = questions[qi].text;
      pending.current[qi] = transcribe(rec, "accurate").then((r) => ({ question, text: r.text, duration: rec.seconds, words: r.words }));
    }
    if (qi + 1 < questions.length) {
      ask(qi + 1);
      return;
    }
    setPhase("processing");
    const parts = await Promise.all(pending.current.filter(Boolean));
    const r = await submitSpeaking(id, parts);
    if (r.id) router.push(`/app/results/${r.id}`);
    else {
      setError(r.error === "limit" ? "limit" : r.error ?? "Не удалось проанализировать запись. Попробуй ещё раз.");
      setPhase("error");
    }
  }, [mic, qi, questions, ask, id, router]);

  // Countdown for preparation and for the answer
  useEffect(() => {
    if (phase !== "prep" && phase !== "answer") return;
    if (left <= 0) {
      if (phase === "prep") { setLeft(answerSeconds); setPhase("answer"); }
      else next();
      return;
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, left, answerSeconds, next]);

  useEffect(() => {
    if (phase !== "processing") return;
    const t = setInterval(() => setTip((i) => (i + 1) % TIPS.length), 3000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => () => stopVoice(), []);

  if (phase === "intro") {
    return (
      <div className="mx-auto grid max-w-2xl gap-6 py-6">
        <Link href="/app/tests?skill=speaking" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted hover:text-ink"><X size={16} /> Выйти</Link>
        <div>
          <h1 className="display text-3xl font-bold">Speaking, Part {part}: {topic}</h1>
          <p className="mt-2 text-muted">
            {part === 1 && "Интервью: короткие вопросы о тебе. Отвечай по 2-4 предложения."}
            {part === 2 && "Карточка: минута на подготовку и до двух минут монолога."}
            {part === 3 && "Дискуссия: развёрнутые ответы с аргументами и примерами."}
          </p>
        </div>
        <div className="card flex gap-4 p-5">
          <Mascot className="w-12 shrink-0" />
          <p className="text-[15px] leading-relaxed">Экзаменатор зачитает каждый вопрос вслух. Запись начнётся сама, нажми «Далее», когда закончишь ответ.</p>
        </div>
        <label className="flex items-center gap-3 text-[15px]">
          <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} className="size-5 accent-[var(--fire)]" />
          Медленный темп речи экзаменатора
        </label>
        <button onClick={() => ask(0)} className="btn btn-fire w-fit px-7 py-4 text-base">Начать Part {part} <ArrowRight size={18} weight="bold" /></button>
        <p className="text-sm text-muted">Браузер спросит доступ к микрофону, разреши его.</p>
      </div>
    );
  }

  if (phase === "processing") {
    return (
      <div className="grid min-h-[60dvh] place-items-center text-center">
        <div className="grid justify-items-center gap-5">
          <div className="size-14 animate-spin rounded-full border-4 border-fire-soft border-t-fire calm:animate-none" aria-hidden />
          <p className="display text-xl font-bold">Транскрибируем речь и оцениваем</p>
          <p className="max-w-[46ch] text-muted" aria-live="polite">{TIPS[tip]}</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="mx-auto grid max-w-xl gap-4 py-12 text-center">
        <h1 className="display text-2xl font-bold">{error === "limit" ? "Проверки на сегодня закончились" : "Не получилось записать ответ"}</h1>
        <p className="text-muted">
          {error === "limit" ? "Бесплатно доступны 3 проверки Speaking в день. С Premium до 80." : mic.error ? MIC_ERRORS[mic.error] : error}
        </p>
        <div className="flex justify-center gap-3">
          {error === "limit" ? <Link href="/pricing" className="btn btn-fire">Получить Premium</Link> : <button onClick={() => { pending.current = []; setError(""); ask(0); }} className="btn btn-fire">Попробовать снова</button>}
          <Link href="/app/tests?skill=speaking" className="btn btn-ghost">К тестам</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-muted">Part {part} · вопрос {qi + 1} из {questions.length}</p>
        <div className="flex gap-2">
          <button onClick={() => playVoice(slow ? q.slow : q.audio, q.spoken)} className="btn btn-ghost btn-sm" aria-label="Повторить вопрос"><SpeakerHigh size={16} /> Ещё раз</button>
          <button onClick={() => setShowText((s) => !s)} className="btn btn-ghost btn-sm" aria-pressed={showText}>
            {showText ? <EyeSlash size={16} /> : <Eye size={16} />} {showText ? "Скрыть текст" : "Показать текст"}
          </button>
        </div>
      </div>

      <div className="card grid justify-items-center gap-6 px-5 py-10 text-center">
        <div className="relative grid size-40 place-items-center">
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{ scale: phase === "answer" && !reduce ? level : 1, background: "radial-gradient(circle, color-mix(in oklab, var(--fire) 35%, transparent), transparent 70%)" }}
          />
          <Mascot animated className={`relative w-24 ${phase === "asking" ? "bob" : ""}`} />
        </div>
        <p className="text-sm font-bold text-fire-text" aria-live="polite">
          {phase === "asking" && "Экзаменатор задаёт вопрос…"}
          {phase === "prep" && `Подготовка · ${clock(left)}`}
          {phase === "answer" && (mic.recording ? `Запись · осталось ${clock(left)}` : "Включаем микрофон…")}
        </p>
        {showText && <p className="max-w-[56ch] whitespace-pre-line text-left text-[17px] leading-relaxed">{q.text}</p>}
        {phase === "prep" && (
          <div className="w-full max-w-lg text-left">
            <label htmlFor="notes" className="label">Заметки</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="field mt-2 min-h-28" placeholder="Ключевые слова для каждого пункта" />
            <button onClick={() => { setLeft(answerSeconds); setPhase("answer"); }} className="btn btn-ink btn-sm mt-3">Я готов(а), начать ответ</button>
          </div>
        )}
        {phase === "answer" && part === 2 && notes && <p className="max-w-lg whitespace-pre-line rounded-2xl bg-surface-2 p-4 text-left text-sm">{notes}</p>}
        {phase === "answer" && mic.caption && <p className="max-w-[56ch] text-muted">{mic.caption}</p>}
        {phase === "answer" && (
          <button onClick={next} disabled={!mic.recording} className="btn btn-fire px-7 py-4 text-base">
            {mic.recording ? <Stop size={18} weight="fill" /> : <Microphone size={18} weight="fill" />}
            {qi + 1 < questions.length ? "Далее" : "Закончить"}
          </button>
        )}
      </div>
    </div>
  );
}
