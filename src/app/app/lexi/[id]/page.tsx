import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle, Lightning, Sparkle, Target } from "@phosphor-icons/react/dist/ssr";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { persona as personaById } from "@/lib/preppy/personas";
import { topicFor } from "@/lib/preppy/lexi";
import { speechStats } from "@/lib/preppy/lexi-review";
import type { Turn } from "@/lib/preppy/engine";
import type { ConvState, StoredReview } from "@/lib/lexi-server";
import { AddWordButton } from "@/components/app/AddWordButton";
import { Mascot } from "@/components/ui/Mascot";
import { PendingRefresh } from "@/components/app/PendingRefresh";
import { reviewPending } from "@/app/actions";

export const metadata: Metadata = { title: "Разбор разговора" };

function mmss(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.round(s) % 60).padStart(2, "0")}`;
}

const CRITERIA = [
  { key: "fluency", label: "Fluency & Coherence", hint: "беглость и связность" },
  { key: "lexical", label: "Lexical Resource", hint: "словарный запас" },
  { key: "grammar", label: "Grammar", hint: "грамматика" },
] as const;

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await currentUser())!;
  const conv = await db.conversation.findFirst({ where: { id, userId: user.id } });
  if (!conv) notFound();
  const turns = JSON.parse(conv.turns) as Turn[];
  const state = JSON.parse(conv.state) as ConvState;
  const r = conv.review ? (JSON.parse(conv.review) as StoredReview) : null;
  const topic = topicFor(conv.topic, state.topicTitle ?? state.lexi?.topicTitle);
  const stats = speechStats(turns);
  const llm = r?.llm;

  if (!r || r.turns === 0) {
    return (
      <div className="grid place-items-center gap-4 py-16 text-center">
        <Mascot className="w-24" />
        <h1 className="display text-2xl font-bold">В следующий раз поговори подольше!</h1>
        <p className="max-w-[40ch] text-muted">Для разбора нужно хотя бы пара ответов.</p>
        <Link href="/app/lexi" className="btn btn-fire">Назад к Lexi</Link>
      </div>
    );
  }

  const tiles = [
    { label: "ответов", value: String(stats.answers) },
    { label: "английских слов", value: String(stats.englishWords) },
    { label: "время речи", value: mmss(stats.speechSeconds) },
    { label: "слов в минуту", value: stats.wpm ? String(stats.wpm) : "—" },
  ];

  return (
    <div className="grid gap-8">
      <Link href="/app/lexi" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft size={16} /> Назад к Lexi
      </Link>
      <div>
        <h1 className="display text-3xl font-bold md:text-4xl">Разбор разговора</h1>
        <p className="mt-2 text-muted">{topic.title} · {personaById(conv.persona).name} · {conv.createdAt.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}</p>
      </div>

      {r.llmState === "pending" && (
        <PendingRefresh check={reviewPending.bind(null, conv.id)} title="Lexi пишет разбор…" text="Оценка по критериям IELTS, твои ошибки и как сказать сильнее. Обычно секунд десять." />
      )}

      {llm && (
        <section className="relative overflow-hidden rounded-[2rem] bg-[#140f24] p-6 text-white md:p-8">
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, var(--fire), transparent 65%)" }} />
          <div className="relative grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
            <div className="grid size-36 place-items-center rounded-full border-4 border-[#ff6a2b] text-center">
              <span>
                <span className="display block text-5xl font-extrabold">{llm.bands.overall?.toFixed(1) ?? "—"}</span>
                <span className="text-xs font-bold uppercase text-white/70">{llm.bands.overall ? "примерный балл" : "мало речи"}</span>
              </span>
            </div>
            <div className="grid gap-3">
              {CRITERIA.map((c) => {
                const b = llm.bands[c.key];
                return (
                  <div key={c.key}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span><b>{c.label}</b> <span className="text-white/60">· {c.hint}</span></span>
                      <span className="display text-lg font-extrabold">{b?.toFixed(1) ?? "—"}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#ff9a0a] to-[#ff5a1f]" style={{ width: `${b ? ((b - 3) / 6) * 100 : 0}%` }} />
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-white/50">Оценка по одному разговору, это ориентир, а не официальный балл. Произношение оценивается в Speaking-тесте.</p>
            </div>
          </div>
          <div className="relative mt-6 flex gap-3 rounded-3xl bg-white/[0.07] p-4">
            <Mascot className="w-9 shrink-0" />
            <p className="text-[15px] leading-relaxed">{llm.summary}</p>
          </div>
        </section>
      )}

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((s, i) => (
          <div key={s.label} className={i === 0 ? "rounded-3xl bg-fire p-5 text-[#1b1433]" : "card p-5"}>
            <dt className={`text-sm ${i === 0 ? "font-bold" : "text-muted"}`}>{s.label}</dt>
            <dd className="display mt-1 text-3xl font-extrabold">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-6">
          <h2 className="flex items-center gap-2 font-bold"><CheckCircle size={22} weight="fill" className="text-ok" /> Что получилось</h2>
          <ul className="mt-4 grid list-disc gap-3 pl-5 text-[15px] leading-relaxed">{(llm?.strengths.length ? llm.strengths : r.wentWell).map((t) => <li key={t}>{t}</li>)}</ul>
        </section>
        <section className="card p-6">
          <h2 className="flex items-center gap-2 font-bold"><Target size={22} weight="fill" className="text-fire-text" /> Над чем поработать</h2>
          <ul className="mt-4 grid list-disc gap-3 pl-5 text-[15px] leading-relaxed">{(llm?.work.length ? llm.work : r.toWork).map((t) => <li key={t}>{t}</li>)}</ul>
        </section>
      </div>

      {(llm ? llm.mistakes : r.fixes).length > 0 && (
        <section>
          <h2 className="display text-xl font-bold">Ошибки и как правильно</h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {(llm ? llm.mistakes : r.fixes).map((f) => (
              <li key={f.wrong + f.right} className="card grid gap-2 p-5">
                <p className="text-[15px]">
                  <span className="text-bad line-through decoration-2">{f.wrong}</span>
                  <ArrowRight size={16} className="mx-2 inline" />
                  <span className="font-bold text-ok">{f.right}</span>
                </p>
                {f.why && <p className="text-sm text-muted">{f.why}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {llm && llm.better.length > 0 && (
        <section>
          <h2 className="display flex items-center gap-2 text-xl font-bold"><Lightning size={22} weight="fill" className="text-fire" /> Как сказать на 7+</h2>
          <div className="mt-4 grid gap-3">
            {llm.better.map((b) => (
              <div key={b.original} className="card grid gap-3 p-5 md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase text-muted">Ты сказал(а)</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-muted">{b.original}</p>
                </div>
                <div className="rounded-2xl bg-ok-soft p-3">
                  <p className="text-xs font-bold uppercase text-ok">Сильнее</p>
                  <p className="mt-1 text-[15px] font-semibold leading-relaxed">{b.improved}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {llm && llm.vocab.length > 0 ? (
        <section className="card p-6">
          <h2 className="flex items-center gap-2 font-bold"><Sparkle size={20} weight="fill" className="text-fire" /> Слова по теме</h2>
          <p className="mt-1 text-sm text-muted">Нажми «+», чтобы добавить в словарь и повторять по карточкам.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {llm.vocab.map((v) => (
              <li key={v.en} className="flex items-start justify-between gap-3 rounded-2xl bg-surface-2 p-4">
                <span className="min-w-0">
                  <span className="block font-bold">{v.en} <span className="font-normal text-muted">— {v.ru}</span></span>
                  {v.example && <span className="mt-1 block text-sm italic text-muted">{v.example}</span>}
                </span>
                <AddWordButton term={v.en} meaning={v.ru} example={v.example} source="preppy" label="+" />
              </li>
            ))}
          </ul>
        </section>
      ) : r.topicWords.length > 0 ? (
        <section className="card p-6">
          <h2 className="font-bold">Слова по теме</h2>
          <p className="mt-1 text-sm text-muted">Нажми, чтобы добавить в словарь и повторять по карточкам.</p>
          <div className="mt-4 flex flex-wrap gap-2">{r.topicWords.map((w) => <AddWordButton key={w} term={w} source="preppy" />)}</div>
        </section>
      ) : null}

      {llm && llm.next.length > 0 && (
        <section className="card p-6">
          <h2 className="font-bold">Что делать дальше</h2>
          <ol className="mt-4 grid list-decimal gap-2 pl-5 text-[15px] leading-relaxed">{llm.next.map((t) => <li key={t}>{t}</li>)}</ol>
        </section>
      )}

      <details className="card p-6">
        <summary className="cursor-pointer font-bold">Весь разговор</summary>
        <ol className="mt-4 grid gap-3">
          {turns.map((t, i) => (
            <li key={i} className={`max-w-[85%] rounded-3xl px-4 py-3 text-[15px] leading-relaxed ${t.role === "preppy" ? "bg-surface-2" : "ml-auto bg-fire-soft"}`}>
              {t.text || "(тишина)"}
              {t.fix && <span className="mt-1 block text-xs text-muted">{t.fix.wrong} → <b className="text-ok">{t.fix.right}</b>{t.fix.why ? `: ${t.fix.why}` : ""}</span>}
            </li>
          ))}
        </ol>
      </details>

      <div className="relative overflow-hidden rounded-[2rem] bg-[#1b1433] px-6 py-10 text-white md:px-10">
        <h2 className="display max-w-[22ch] text-2xl font-bold">Хочешь точный балл? Пройди Speaking-мок</h2>
        <p className="mt-2 max-w-[48ch] opacity-80">Три части как на экзамене, оценка по четырём критериям, включая произношение.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/app/tests?skill=speaking" className="btn btn-fire">К Speaking</Link>
          <Link href="/app/lexi" className="btn border border-white/25 text-white hover:bg-white/10">Ещё разговор</Link>
        </div>
      </div>
    </div>
  );
}
