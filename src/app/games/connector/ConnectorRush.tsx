"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowCounterClockwise, Lightning, Trophy } from "@phosphor-icons/react";
import { CONNECTOR_BANK, type ConnectorQ } from "@/lib/games/connector";

type Level = keyof typeof CONNECTOR_BANK;
const ROUND = 60; // seconds per game
const PER_Q = 5; // seconds per question
const LEVELS: { id: Level; name: string }[] = [
  { id: "easy", name: "Лёгкий" },
  { id: "medium", name: "Средний" },
  { id: "hard", name: "Band 7+" },
];

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Renders **bold** from the rules. */
function Rule({ text }: { text: string }) {
  return <>{text.split("**").map((part, i) => (i % 2 ? <b key={i} className="text-ink">{part}</b> : part))}</>;
}

type Shown = { q: ConnectorQ; options: string[] };
type Answer = { q: ConnectorQ; picked: string | null };

export function ConnectorRush() {
  const [level, setLevel] = useState<Level>("easy");
  const [state, setState] = useState<"menu" | "play" | "over">("menu");
  const [left, setLeft] = useState(ROUND);
  const [qLeft, setQLeft] = useState(PER_Q);
  const [shown, setShown] = useState<Shown | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [best, setBest] = useState(0);
  const deck = useRef<ConnectorQ[]>([]);

  useEffect(() => {
    try { setBest(Number(localStorage.getItem(`golexi-connector-${level}`)) || 0); } catch { /* private mode */ }
  }, [level]);

  const next = useCallback(() => {
    if (!deck.current.length) deck.current = shuffle(CONNECTOR_BANK[level]);
    const q = deck.current.pop()!;
    setShown({ q, options: shuffle([...q.options]) });
    setPicked(null);
    setQLeft(PER_Q);
  }, [level]);

  const start = () => {
    deck.current = shuffle(CONNECTOR_BANK[level]);
    setScore(0); setStreak(0); setAnswers([]); setLeft(ROUND);
    setState("play");
    next();
  };

  const choose = useCallback((opt: string | null) => {
    if (!shown || picked !== null) return;
    const right = opt === shown.q.options[0];
    setPicked(opt ?? "");
    setAnswers((a) => [...a, { q: shown.q, picked: opt }]);
    if (right) {
      setStreak((s) => s + 1);
      setScore((s) => s + 10 + Math.min(streak, 5) * 2 + qLeft);
    } else setStreak(0);
    // A right answer moves on fast; a wrong one leaves time to read the rule
    setTimeout(next, right ? 450 : 2200);
  }, [shown, picked, streak, qLeft, next]);

  // Game clock and per-question clock
  useEffect(() => {
    if (state !== "play") return;
    const t = setInterval(() => {
      setLeft((s) => s - 1);
      setQLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(t);
  }, [state]);

  useEffect(() => {
    if (state === "play" && qLeft <= 0 && picked === null) choose(null);
  }, [qLeft, state, picked, choose]);

  useEffect(() => {
    if (state !== "play" || left > 0) return;
    setState("over");
    if (score > best) {
      setBest(score);
      try { localStorage.setItem(`golexi-connector-${level}`, String(score)); } catch { /* private mode */ }
    }
  }, [left, state, score, best, level]);

  if (state === "menu") {
    return (
      <div className="card mx-auto grid max-w-xl gap-6 p-6 text-center md:p-10">
        <span className="mx-auto grid size-16 place-items-center rounded-3xl text-white" style={{ background: "linear-gradient(150deg, #8b6cf6, #5b3fd6)" }}><Lightning size={32} weight="fill" /></span>
        <div>
          <h1 className="display text-3xl font-extrabold">Connector Rush</h1>
          <p className="mt-2 text-muted">60 секунд, 5 секунд на вопрос. Выбери связку, которая подходит по смыслу и грамматике. Серия правильных ответов даёт бонус.</p>
        </div>
        <div className="mx-auto flex gap-2" role="radiogroup" aria-label="Уровень">
          {LEVELS.map((l) => (
            <button key={l.id} role="radio" aria-checked={level === l.id} onClick={() => setLevel(l.id)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${level === l.id ? "border-fire bg-fire-soft text-fire-text" : "border-line text-muted hover:text-ink"}`}>
              {l.name}
            </button>
          ))}
        </div>
        {best > 0 && <p className="text-sm text-muted">Твой рекорд: <b className="text-ink">{best}</b></p>}
        <button onClick={start} className="btn btn-fire mx-auto px-8 py-4 text-base">Начать</button>
      </div>
    );
  }

  if (state === "over") {
    const right = answers.filter((a) => a.picked === a.q.options[0]).length;
    const wrong = answers.filter((a) => a.picked !== a.q.options[0]);
    return (
      <div className="mx-auto grid max-w-2xl gap-6">
        <div className="card grid gap-3 p-6 text-center md:p-10">
          <Trophy size={44} weight="fill" className="mx-auto text-fire" />
          <h1 className="display text-3xl font-extrabold">{score} очков</h1>
          <p className="text-muted">Верно {right} из {answers.length}{score >= best && score > 0 ? ". Новый рекорд!" : `. Рекорд: ${best}`}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <button onClick={start} className="btn btn-fire"><ArrowCounterClockwise size={18} weight="bold" /> Ещё раз</button>
            <button onClick={() => setState("menu")} className="btn btn-ghost">Сменить уровень</button>
          </div>
        </div>
        {wrong.length > 0 && (
          <section className="card p-6">
            <h2 className="font-bold">Разбор ошибок</h2>
            <ul className="mt-4 grid gap-4">
              {wrong.map((a, i) => (
                <li key={i} className="border-l-2 border-fire pl-4">
                  <p className="font-semibold">{a.q.text.replace("___", a.q.options[0])}</p>
                  <p className="mt-1 text-sm text-muted">{a.picked ? <>Ты выбрал(а) «{a.picked}». </> : "Время вышло. "}<Rule text={a.q.rule} /></p>
                </li>
              ))}
            </ul>
          </section>
        )}
        <p className="text-center text-sm text-muted">Связки решают критерий Coherence and Cohesion в Writing. <Link href="/quiz" className="font-semibold text-fire-text underline underline-offset-4">Проверь своё эссе целиком</Link></p>
      </div>
    );
  }

  const q = shown!;
  const [before, after] = q.q.text.split("___");
  return (
    <div className="mx-auto grid max-w-2xl gap-5">
      <div className="flex items-center justify-between text-sm font-bold">
        <span>Очки: <span className="display text-lg">{score}</span>{streak >= 2 && <span className="ml-2 text-fire-text">серия ×{streak}</span>}</span>
        <span className={left <= 10 ? "text-bad" : ""}>{left} с</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full bg-fire transition-[width] duration-1000 ease-linear" style={{ width: `${(Math.max(0, qLeft - 1) / PER_Q) * 100}%` }} />
      </div>
      <div className="card p-6 md:p-10">
        <p className="display text-2xl font-bold leading-snug md:text-3xl">
          {before}
          <span className={`mx-1 inline-block min-w-16 border-b-4 px-1 text-center ${picked === null ? "border-fire" : picked === q.q.options[0] ? "border-ok text-ok" : "border-bad text-ok"}`}>{picked === null ? " " : q.q.options[0]}</span>
          {after}
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3">
          {q.options.map((o) => {
            const isRight = o === q.q.options[0];
            const tone = picked === null ? "border-line hover:border-fire hover:bg-fire-soft" : isRight ? "border-ok bg-ok-soft text-ok" : o === picked ? "border-bad bg-bad-soft text-bad" : "border-line opacity-50";
            return (
              <button key={o} onClick={() => choose(o)} disabled={picked !== null} className={`rounded-2xl border-2 px-4 py-4 text-lg font-bold transition ${tone}`}>{o}</button>
            );
          })}
        </div>
        {picked !== null && picked !== q.q.options[0] && <p className="mt-5 text-muted"><Rule text={q.q.rule} /></p>}
      </div>
    </div>
  );
}
