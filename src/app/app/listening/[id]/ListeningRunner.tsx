"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Headphones, Pause, Play, ArrowCounterClockwise } from "@phosphor-icons/react";
import type { QuestionGroup } from "@/lib/content/types";
import { QuestionGroups } from "@/components/app/Questions";
import { TestBar } from "@/components/app/TestBar";
import { submitTest } from "@/app/actions";
import { preloadVoice } from "@/components/app/voice-client";

type Line = { audio: string; text: string; female: boolean };
type Mode = "exam" | "practice";

const PREP_SECONDS = 30;

export function ListeningRunner({
  id, title, part, context, lines, groups,
}: { id: string; title: string; part: number; context: string; lines: Line[]; groups: QuestionGroup[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [prep, setPrep] = useState(PREP_SECONDS);
  const [index, setIndex] = useState(-1); // line being played, -1 before start
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const started = useRef(Date.now());
  const total = groups.reduce((a, g) => a + g.questions.length, 0);
  const answered = Object.values(answers).filter((v) => v.trim()).length;

  // Exam mode: questions first, then the recording starts by itself
  useEffect(() => {
    if (mode !== "exam" || index >= 0) return;
    if (prep <= 0) {
      setIndex(0);
      setPlaying(true);
      return;
    }
    const t = setTimeout(() => setPrep((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [mode, prep, index]);

  // Play the current line, then move to the next one after a short natural gap
  useEffect(() => {
    if (index < 0 || !playing) return;
    if (index >= lines.length) {
      setPlaying(false);
      setFinished(true);
      return;
    }
    let cancelled = false;
    const next = () => {
      if (cancelled) return;
      setTimeout(() => !cancelled && setIndex((i) => i + 1), 450);
    };
    const line = lines[index];
    const failed = () => {
      setAudioError(true);
      next();
    };
    const a = new Audio(line.audio);
    audio.current = a;
    a.onended = next;
    a.onerror = failed;
    a.play().catch(failed);
    // Fetch the next lines ahead so there is no gap between speakers
    for (const l of lines.slice(index + 1, index + 3)) preloadVoice(l.audio);
    return () => {
      cancelled = true;
      a.pause();
    };
  }, [index, playing, lines]);

  const toggle = () => {
    if (index < 0) {
      setIndex(0);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  };

  const finish = async () => {
    setSending(true);
    const r = await submitTest("listening", id, answers, (Date.now() - started.current) / 60000);
    router.push(`/app/results/${r.id}`);
  };

  if (!mode) {
    return (
      <div className="mx-auto grid max-w-2xl gap-6 py-6">
        <span className="grid size-14 place-items-center rounded-2xl bg-fire-soft text-fire-text"><Headphones size={30} weight="duotone" /></span>
        <div>
          <h1 className="display text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-muted">Listening, Part {part}. {context}</p>
        </div>
        <div className="card grid gap-2 p-5 text-[15px]">
          <p className="font-bold">Перед началом</p>
          <p className="text-muted">Надень наушники и найди тихое место. Отвечай прямо во время прослушивания, как на экзамене.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button onClick={() => setMode("exam")} className="card p-5 text-left transition hover:-translate-y-0.5 hover:ring-2 hover:ring-fire">
            <p className="font-bold">Как на экзамене</p>
            <p className="mt-1 text-sm text-muted">30 секунд на вопросы, потом запись один раз, без паузы.</p>
          </button>
          <button onClick={() => setMode("practice")} className="card p-5 text-left transition hover:-translate-y-0.5 hover:ring-2 hover:ring-fire">
            <p className="font-bold">Тренировка</p>
            <p className="mt-1 text-sm text-muted">Пауза и повтор с начала, когда нужно.</p>
          </button>
        </div>
      </div>
    );
  }

  const progress = index < 0 ? 0 : Math.min(1, index / lines.length);

  return (
    <div>
      <TestBar title={title} minutes={10} answered={answered} total={total} onSubmit={finish} submitting={sending} />

      <div className="card mb-8 flex flex-wrap items-center gap-4 p-5">
        {mode === "practice" ? (
          <>
            <button onClick={toggle} className="grid size-12 place-items-center rounded-full bg-fire text-[#1b1433]" aria-label={playing ? "Пауза" : "Слушать"}>
              {playing ? <Pause size={22} weight="fill" /> : <Play size={22} weight="fill" />}
            </button>
            <button onClick={() => { setIndex(0); setPlaying(true); setFinished(false); }} className="btn btn-ghost btn-sm" aria-label="С начала">
              <ArrowCounterClockwise size={16} /> С начала
            </button>
          </>
        ) : (
          <span className="grid size-12 place-items-center rounded-full bg-fire-soft text-fire-text"><Headphones size={24} weight="fill" /></span>
        )}
        <div className="min-w-[180px] flex-1">
          <p className="text-sm font-bold">
            {mode === "exam" && index < 0 ? `Посмотри вопросы. Запись начнётся через ${prep} с` : finished ? "Запись закончилась. Проверь ответы и отправляй." : playing ? "Идёт запись…" : "Пауза"}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-fire transition-[width] duration-500" style={{ width: `${progress * 100}%` }} />
          </div>
          {audioError && <p className="mt-2 text-xs text-muted">Озвучка сейчас недоступна. Обнови страницу через минуту.</p>}
        </div>
      </div>

      <QuestionGroups groups={groups} answers={answers} onAnswer={(qid, v) => setAnswers((a) => ({ ...a, [qid]: v }))} />
      <button onClick={finish} disabled={sending} className="btn btn-fire mt-8">{sending ? "Проверяем…" : "Проверить ответы"}</button>
    </div>
  );
}
