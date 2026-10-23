"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowCounterClockwise, ArrowRight, Headphones, Play, SpeakerHigh, Trophy } from "@phosphor-icons/react";
import { playVoice, stopVoice } from "@/components/app/voice-client";

type Item = { id: string; audio: string; script: string; question: string; options: string[]; answer: string; markers: string[] };

const ROUND = 6; // clips per game
const ANSWER_SECONDS = 15;

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** The script with the change-of-mind markers highlighted. */
function Marked({ text, markers }: { text: string; markers: string[] }) {
  const re = new RegExp(`(${markers.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return <>{text.split(re).map((part, i) => (markers.some((m) => m.toLowerCase() === part.toLowerCase()) ? <mark key={i} className="rounded bg-fire-soft px-1 font-semibold text-fire-text">{part}</mark> : part))}</>;
}

export function TrapGame({ items }: { items: Item[] }) {
  const [state, setState] = useState<"menu" | "listen" | "answer" | "result" | "over">("menu");
  const [round, setRound] = useState<Item[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [left, setLeft] = useState(ANSWER_SECONDS);
  const [results, setResults] = useState<boolean[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const alive = useRef(true);

  useEffect(() => () => { alive.current = false; stopVoice(); }, []);

  const play = async (list: Item[], index: number) => {
    setI(index);
    setPicked(null);
    setOptions(shuffle(list[index].options));
    setState("listen");
    await playVoice(list[index].audio);
    if (!alive.current) return;
    setLeft(ANSWER_SECONDS);
    setState((s) => (s === "listen" ? "answer" : s));
  };

  const start = () => {
    const list = shuffle(items).slice(0, ROUND);
    setRound(list);
    setResults([]);
    play(list, 0);
  };

  const choose = (o: string | null) => {
    if (picked !== null) return;
    stopVoice();
    setPicked(o ?? "");
    setResults((r) => [...r, o === round[i].answer]);
    setState("result");
  };

  useEffect(() => {
    if (state !== "answer") return;
    if (left <= 0) { choose(null); return; }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, left]);

  const next = () => (i + 1 < round.length ? play(round, i + 1) : setState("over"));

  if (state === "menu") {
    return (
      <div className="card mx-auto grid max-w-xl gap-6 p-6 text-center md:p-10">
        <span className="mx-auto grid size-16 place-items-center rounded-3xl text-white" style={{ background: "linear-gradient(150deg, #23c483, #0f8a5f)" }}><Headphones size={32} weight="fill" /></span>
        <div>
          <h1 className="display text-3xl font-extrabold">Listening Trap</h1>
          <p className="mt-2 text-muted">Самые коварные вопросы IELTS не те, где говорят быстро, а те, где диктор меняет ответ на ходу. Послушай фрагмент и выбери <b className="text-ink">финальный</b> ответ.</p>
        </div>
        <p className="text-sm text-muted">{ROUND} фрагментов, каждый звучит один раз, как на экзамене. Надень наушники.</p>
        <button onClick={start} className="btn btn-fire mx-auto px-8 py-4 text-base"><Play size={18} weight="fill" /> Начать</button>
      </div>
    );
  }

  if (state === "over") {
    const n = results.filter(Boolean).length;
    return (
      <div className="card mx-auto grid max-w-xl gap-4 p-6 text-center md:p-10">
        <Trophy size={44} weight="fill" className="mx-auto text-fire" />
        <h1 className="display text-3xl font-extrabold">{n} из {round.length}</h1>
        <p className="text-muted">{n === round.length ? "Ни одна ловушка не сработала. Так держать!" : n >= round.length / 2 ? "Неплохо. Слушай слова вроде actually, sorry, no, now: после них идёт настоящий ответ." : "Ловушки пока ловят тебя. Главное правило: не записывай первый вариант, дослушай фразу до конца."}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={start} className="btn btn-fire"><ArrowCounterClockwise size={18} weight="bold" /> Ещё раунд</button>
          <Link href="/quiz" className="btn btn-ghost">Полный Listening-тест</Link>
        </div>
      </div>
    );
  }

  const item = round[i];
  return (
    <div className="mx-auto grid max-w-2xl gap-5">
      <div className="flex items-center justify-between text-sm font-bold">
        <span>Фрагмент {i + 1} из {round.length}</span>
        <span className="flex gap-1">{round.map((_, k) => <span key={k} className={`size-2.5 rounded-full ${k < results.length ? (results[k] ? "bg-ok" : "bg-bad") : k === i ? "bg-fire" : "bg-line"}`} />)}</span>
      </div>
      <div className="card p-6 md:p-10">
        <div className="flex items-center gap-4">
          <span className={`grid size-14 shrink-0 place-items-center rounded-full ${state === "listen" ? "animate-pulse bg-fire text-[#1b1433]" : "bg-surface-2 text-muted"}`}><SpeakerHigh size={26} weight="fill" /></span>
          <p className="font-bold">{state === "listen" ? "Слушай внимательно…" : state === "answer" ? `Выбери ответ · ${left} с` : picked === item.answer ? "Верно, ловушка не сработала" : "Попался!"}</p>
        </div>
        <p className="display mt-6 text-2xl font-bold">{item.question}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {options.map((o) => {
            const tone = state !== "result" ? "border-line hover:border-fire hover:bg-fire-soft" : o === item.answer ? "border-ok bg-ok-soft text-ok" : o === picked ? "border-bad bg-bad-soft text-bad" : "border-line opacity-50";
            return <button key={o} disabled={state !== "answer"} onClick={() => choose(o)} className={`rounded-2xl border-2 px-4 py-4 text-lg font-bold transition disabled:cursor-default ${tone}`}>{o}</button>;
          })}
        </div>
        {state === "result" && (
          <div className="mt-6 grid gap-4">
            <p className="rounded-2xl bg-surface-2 p-4 leading-relaxed">“<Marked text={item.script} markers={item.markers} />”</p>
            <p className="text-sm text-muted">Слова-сигналы: {item.markers.map((m) => `«${m}»`).join(", ")}. После них идёт настоящий ответ.</p>
            <button onClick={next} className="btn btn-fire w-fit">{i + 1 < round.length ? "Дальше" : "Итог"} <ArrowRight size={18} weight="bold" /></button>
          </div>
        )}
      </div>
    </div>
  );
}
