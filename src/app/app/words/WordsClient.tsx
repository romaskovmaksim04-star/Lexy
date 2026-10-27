"use client";

import { useCalm } from "@/lib/motion-pref";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowsClockwise, CardsThree, Check, Plus, SpeakerHigh, Star, Trash } from "@phosphor-icons/react";
import { addWord, learnWords, removeWord, reviewWord } from "@/app/actions";
import { playVoice } from "@/components/app/voice-client";
import type { Grade } from "@/lib/srs";

export type StudyCard = { id: string; term: string; meaning: string; ipa: string; example: string; audio: string; reps: number; interval: number; ease: number };
type Deck = { topic: string; total: number; added: number; ids: string[]; sample: string[] };
type Own = { id: string; term: string; meaning: string; example: string; source: string };

const SOURCE_RU: Record<string, string> = { manual: "вручную", reading: "из Reading", listening: "из Listening", preppy: "из Lexi", writing: "из Writing" };
const TOPIC_RU: Record<string, string> = { Education: "Образование", Work: "Работа", Environment: "Экология", Technology: "Технологии", Health: "Здоровье", Society: "Общество", Academic: "Академическая лексика" };

/** The interval the card would get, as a short label for the grade buttons. */
function preview(c: StudyCard, g: Grade): string {
  if (g === 0) return "10 мин";
  const reps = c.reps + 1;
  const days = reps === 1 ? (g === 3 ? 3 : 1) : reps === 2 ? (g === 1 ? 3 : 6) : Math.round(c.interval * c.ease * (g === 1 ? 0.8 : g === 3 ? 1.3 : 1));
  return days >= 30 ? `${Math.round(days / 30)} мес` : `${days} дн`;
}

function Session({ cards, onDone }: { cards: StudyCard[]; onDone: (n: number) => void }) {
  const reduce = useCalm();
  const [queue, setQueue] = useState(cards);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const [, start] = useTransition();
  const card = queue[0];

  const grade = (g: Grade) => {
    if (!card) return;
    start(() => reviewWord(card.id, g));
    setFlipped(false);
    // "Again" puts the card back at the end of today's queue
    setQueue((q) => (g === 0 ? [...q.slice(1), q[0]] : q.slice(1)));
    if (g > 0) setDone((d) => d + 1);
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea")) return;
      if (e.code === "Space") { e.preventDefault(); setFlipped((f) => !f); }
      if (flipped && ["Digit1", "Digit2", "Digit3", "Digit4"].includes(e.code)) grade((Number(e.code.slice(-1)) - 1) as Grade);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  useEffect(() => {
    if (!card) onDone(done);
  }, [card, done, onDone]);

  if (!card) return null;
  const buttons: { g: Grade; label: string; cls: string }[] = [
    { g: 0, label: "Снова", cls: "bg-bad-soft text-bad" },
    { g: 1, label: "Трудно", cls: "bg-surface-2" },
    { g: 2, label: "Хорошо", cls: "bg-ok-soft text-ok" },
    { g: 3, label: "Легко", cls: "bg-fire-soft text-fire-text" },
  ];

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between text-sm font-semibold text-muted">
        <span>Карта {done + 1} из {done + queue.length}</span>
        <span>Пробел: перевернуть · 1-4: оценка</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-fire transition-[width] duration-500" style={{ width: `${(done / (done + queue.length)) * 100}%` }} /></div>
      <AnimatePresence mode="wait">
        <motion.button
          key={card.id + String(flipped)}
          type="button"
          onClick={() => setFlipped((f) => !f)}
          initial={{ opacity: 0, rotateX: reduce ? 0 : -8, y: reduce ? 0 : 10 }}
          animate={{ opacity: 1, rotateX: 0, y: 0 }}
          exit={{ opacity: 0, y: reduce ? 0 : -6 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="card grid min-h-[300px] place-items-center p-8 text-center"
          aria-label={flipped ? "Скрыть перевод" : "Показать перевод"}
        >
          <span className="grid justify-items-center gap-3">
            <span className="display text-4xl font-bold md:text-5xl">{card.term}</span>
            {card.ipa && <span className="text-muted">/{card.ipa}/</span>}
            {flipped ? (
              <>
                <span className="mt-2 text-xl font-semibold text-fire-text">{card.meaning || "Перевод не добавлен"}</span>
                {card.example && <span className="max-w-[46ch] text-[15px] italic text-muted">{card.example}</span>}
              </>
            ) : (
              <span className="mt-2 text-sm font-semibold text-muted">Вспомни значение и нажми, чтобы проверить</span>
            )}
          </span>
        </motion.button>
      </AnimatePresence>
      <div className="flex justify-center">
        <button type="button" onClick={() => playVoice(card.audio, card.term)} className="btn btn-ghost btn-sm"><SpeakerHigh size={16} weight="fill" /> Послушать</button>
      </div>
      {flipped ? (
        <div className="grid grid-cols-4 gap-2">
          {buttons.map((b) => (
            <button key={b.g} onClick={() => grade(b.g)} className={`rounded-2xl px-2 py-3 text-center font-bold transition active:scale-[0.98] ${b.cls}`}>
              <span className="block text-[15px]">{b.label}</span>
              <span className="block text-xs font-semibold opacity-75">{preview(card, b.g)}</span>
            </button>
          ))}
        </div>
      ) : (
        <button onClick={() => setFlipped(true)} className="btn btn-ink w-full">Показать ответ</button>
      )}
    </div>
  );
}

export function WordsClient({
  due, decks, levels, own, stats, nextReview,
}: { due: StudyCard[]; decks: Deck[]; levels: Deck[]; own: Own[]; stats: { total: number; learned: number; due: number }; nextReview: string | null }) {
  const router = useRouter();
  const [studying, setStudying] = useState(false);
  const [finished, setFinished] = useState<number | null>(null);
  const [term, setTerm] = useState("");
  const [meaning, setMeaning] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const shuffled = useMemo(() => [...due].sort(() => Math.random() - 0.5), [due]);

  const nextLabel = useMemo(() => {
    if (!nextReview) return null;
    const ms = new Date(nextReview).getTime() - Date.now();
    const h = Math.floor(ms / 3_600_000);
    const m = Math.round((ms % 3_600_000) / 60000);
    return h >= 24 ? `${Math.round(h / 24)} дн` : h ? `${h} ч ${m} мин` : `${m} мин`;
  }, [nextReview]);

  const add = () => start(async () => {
    const r = await addWord(term, meaning);
    if (r.ok) { setTerm(""); setMeaning(""); setMsg("Добавлено в карточки"); router.refresh(); }
    else setMsg(r.error ?? "Не удалось добавить");
  });

  if (studying) {
    return (
      <div className="mx-auto max-w-xl">
        <Session cards={shuffled} onDone={(n) => { setStudying(false); setFinished(n); router.refresh(); }} />
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="display text-3xl font-bold md:text-4xl">Словарь</h1>
        <p className="mt-2 text-muted">Карточки повторяются по кривой забывания: слово возвращается как раз тогда, когда начинает вылетать из головы.</p>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        <div className="rounded-3xl bg-fire p-5 text-[#1b1433]"><dt className="text-sm font-bold">На повторение</dt><dd className="display mt-1 text-3xl font-extrabold">{stats.due}</dd></div>
        <div className="card p-5"><dt className="text-sm text-muted">Выучено</dt><dd className="display mt-1 text-3xl font-extrabold">{stats.learned}</dd></div>
        <div className="card p-5"><dt className="text-sm text-muted">Всего карточек</dt><dd className="display mt-1 text-3xl font-extrabold">{stats.total}</dd></div>
      </dl>

      {finished !== null && (
        <p role="status" className="rounded-3xl bg-ok-soft p-5 font-semibold text-ok">Готово: повторено {finished}. {nextLabel ? `Следующее повторение через ${nextLabel}.` : ""}</p>
      )}

      {stats.due > 0 ? (
        <button onClick={() => { setFinished(null); setStudying(true); }} className="card flex items-center gap-4 p-6 text-left transition hover:-translate-y-0.5">
          <span className="grid size-14 place-items-center rounded-2xl bg-fire-soft text-fire-text"><CardsThree size={30} weight="duotone" /></span>
          <span className="flex-1"><span className="block text-lg font-bold">Повторить слова</span><span className="text-sm text-muted">{stats.due} карточек ждут. Займёт пару минут.</span></span>
          <ArrowsClockwise size={22} />
        </button>
      ) : (
        <div className="card flex items-center gap-4 p-6">
          <span className="grid size-14 place-items-center rounded-2xl bg-ok-soft text-ok"><Check size={28} weight="bold" /></span>
          <span><span className="block text-lg font-bold">{stats.total ? "Всё повторено!" : "Начни с колоды ниже"}</span><span className="text-sm text-muted">{stats.total ? (nextLabel ? `Следующее повторение через ${nextLabel}.` : "") : "Выбери тему, и слова появятся в повторении."}</span></span>
        </div>
      )}

      <section>
        <h2 className="display text-xl font-bold">Колоды для IELTS</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((d) => {
            const full = d.added >= d.total;
            return (
              <div key={d.topic} className="card flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold">{TOPIC_RU[d.topic] ?? d.topic}</p>
                  <span className="chip">{d.added}/{d.total}</span>
                </div>
                <p className="text-sm text-muted">{d.sample.join(", ")}…</p>
                <button disabled={full || pending} onClick={() => start(async () => { await learnWords(d.ids); router.refresh(); })}
                  className={`btn btn-sm mt-auto ${full ? "btn-ghost" : "btn-ink"}`}>
                  {full ? <><Check size={16} weight="bold" /> В повторении</> : <><Star size={16} weight="fill" /> Учить колоду</>}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="display text-xl font-bold">Слова по уровням</h2>
        <p className="mt-1 text-sm text-muted">Около 9700 слов от A1 до C2. Каждое нажатие добавляет в повторение следующие 20.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {levels.map((d) => {
            const full = d.added >= d.total;
            return (
              <div key={d.topic} className="card flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="display text-lg font-bold">{d.topic}</p>
                  <span className="chip">{d.added}/{d.total}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-fire" style={{ width: `${(d.added / Math.max(1, d.total)) * 100}%` }} /></div>
                {!full && <p className="text-sm text-muted">Дальше: {d.sample.join(", ")}…</p>}
                <button disabled={full || pending} onClick={() => start(async () => { await learnWords(d.ids); router.refresh(); })}
                  className={`btn btn-sm mt-auto ${full ? "btn-ghost" : "btn-ink"}`}>
                  {full ? <><Check size={16} weight="bold" /> Все слова в повторении</> : <><Star size={16} weight="fill" /> +{d.ids.length} слов</>}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-bold">Добавить своё слово</h2>
        <form onSubmit={(e) => { e.preventDefault(); add(); }} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="grid gap-2"><label htmlFor="w-term" className="label">Слово или фраза</label><input id="w-term" className="field" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="e.g. outweigh" autoComplete="off" /></div>
          <div className="grid gap-2"><label htmlFor="w-mean" className="label">Перевод</label><input id="w-mean" className="field" value={meaning} onChange={(e) => setMeaning(e.target.value)} placeholder="перевешивать" autoComplete="off" /></div>
          <button disabled={!term.trim() || pending} className="btn btn-fire"><Plus size={16} weight="bold" /> Добавить</button>
        </form>
        {msg && <p role="status" className="mt-3 text-sm font-semibold text-muted">{msg}</p>}
      </section>

      {own.length > 0 && (
        <section>
          <h2 className="display text-xl font-bold">Мои слова</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {own.map((w) => (
              <li key={w.id} className="card flex items-start gap-3 p-4">
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{w.term}</span>
                  <span className="block text-sm text-muted">{w.meaning || "без перевода"} · {SOURCE_RU[w.source] ?? w.source}</span>
                  {w.example && <span className="mt-1 block truncate text-xs italic text-muted">{w.example}</span>}
                </span>
                <button onClick={() => start(async () => { await removeWord(w.id); router.refresh(); })} className="grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-bad-soft hover:text-bad" aria-label={`Удалить ${w.term}`}>
                  <Trash size={16} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
