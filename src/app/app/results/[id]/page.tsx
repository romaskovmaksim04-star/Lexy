import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Lightbulb, Lightning } from "@phosphor-icons/react/dist/ssr";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatBand } from "@/lib/band";
import { getReading } from "@/lib/content/reading";
import { getListening } from "@/lib/content/listening";
import { getSpeaking, getWriting } from "@/lib/content/prompts";
import { allQuestions, isCorrect, type Question } from "@/lib/content/types";
import type { SpeechReport, TextReport } from "@/lib/analysis";
import type { SpeechTiming } from "@/lib/speech";
import type { Issue } from "@/lib/grammar";
import { DRILLS } from "@/lib/grammar";
import { signTts } from "@/lib/voice";
import { catalogFor } from "@/lib/catalog";
import type { Skill } from "@/lib/profile";
import { AnswerReview, type ReviewedQuestion } from "@/components/app/AnswerReview";
import { EssayMarkup } from "@/components/app/EssayMarkup";
import { Contract, type ContractItem } from "@/components/app/Contract";
import { ListenWord, SpeechTimeline } from "@/components/app/SpeechTimeline";
import { AddWordButton } from "@/components/app/AddWordButton";
import { ChartView } from "@/components/app/ChartView";
import { PendingRefresh } from "@/components/app/PendingRefresh";
import { examinerPending } from "@/app/actions";
import type { Examiner } from "@/lib/examiner";

export const metadata: Metadata = { title: "Результат" };

const SECTION_RU: Record<string, string> = { reading: "Reading", listening: "Listening", writing: "Writing", speaking: "Speaking" };

function verdict(band: number, target: number) {
  if (band >= target) return { text: "Уровень цели. Удержи его на следующих тестах.", tone: "text-ok" };
  if (target - band <= 0.5) return { text: `До цели ${formatBand(target)} осталось полбалла.`, tone: "text-fire-text" };
  return { text: `До цели ${formatBand(target)}: ${formatBand(target - band)}. Разбор ниже покажет, где их взять.`, tone: "text-muted" };
}

function Score({ band, target, label, sub }: { band: number; target: number; label: string; sub?: string }) {
  const v = verdict(band, target);
  return (
    <div className="card flex flex-wrap items-center gap-6 p-6 md:p-8">
      <div className="grid size-32 shrink-0 place-items-center rounded-full bg-fire text-[#1b1433]" style={{ boxShadow: "0 18px 40px -18px rgb(255 90 31 / 0.9)" }}>
        <div className="text-center">
          <p className="display text-5xl font-extrabold leading-none">{formatBand(band)}</p>
          <p className="mt-1 text-xs font-bold">из 9.0</p>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-muted">{label}</p>
        {sub && <p className="display mt-1 text-2xl font-bold">{sub}</p>}
        <p className={`mt-2 text-[15px] font-semibold ${v.tone}`}>{v.text}</p>
      </div>
    </div>
  );
}

function Criteria({ items }: { items: { key: string; title: string; band: number; notes: string[] }[] }) {
  return (
    <section>
      <h2 className="display text-xl font-bold">Оценка по критериям</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((c) => (
          <div key={c.key} className="card p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-bold">{c.title}</p>
              <p className="display text-2xl font-extrabold">{formatBand(c.band)}</p>
            </div>
            {c.notes.length ? (
              <ul className="mt-3 grid gap-2 text-sm leading-relaxed text-muted">{c.notes.map((n) => <li key={n}>{n}</li>)}</ul>
            ) : (
              <p className="mt-3 text-sm text-ok">Замечаний нет.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function ExaminerBlock({ ex }: { ex: Examiner }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-[#140f24] p-6 text-white md:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, var(--fire), transparent 65%)" }} />
      <p className="relative text-xs font-bold uppercase tracking-wide text-[#ffb27a]">Комментарий экзаменатора</p>
      <p className="relative mt-2 text-[15px] leading-relaxed md:text-base">{ex.summary}</p>
      {ex.next.length > 0 && (
        <div className="relative mt-5">
          <p className="text-sm font-bold">Как получить +0.5</p>
          <ol className="mt-2 grid list-decimal gap-1.5 pl-5 text-sm leading-relaxed text-white/80">{ex.next.map((n) => <li key={n}>{n}</li>)}</ol>
        </div>
      )}
    </section>
  );
}

function Rewrite({ rw, label }: { rw: NonNullable<Examiner["rewrite"]>; label: string }) {
  return (
    <section>
      <h2 className="display flex items-center gap-2 text-xl font-bold"><Lightning size={22} weight="fill" className="text-fire" /> {label}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="card p-5">
          <p className="text-xs font-bold uppercase text-muted">У тебя</p>
          <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-muted">{rw.original}</p>
        </div>
        <div className="rounded-3xl bg-ok-soft p-5">
          <p className="text-xs font-bold uppercase text-ok">На 7.5+</p>
          <p className="mt-2 whitespace-pre-line text-[15px] font-medium leading-relaxed">{rw.improved}</p>
        </div>
      </div>
    </section>
  );
}

/** The examiner's mistakes as marks in the text (first occurrence of each), next to the automatic ones. */
function examinerMarks(text: string, ex: Examiner | undefined, taken: { index: number; length: number }[]) {
  if (!ex) return [];
  const lower = text.toLowerCase();
  const out: { index: number; length: number; fix: string; why: string; kind: Issue["kind"] }[] = [];
  for (const m of ex.mistakes) {
    const index = lower.indexOf(m.wrong.toLowerCase());
    if (index < 0) continue;
    const overlaps = [...taken, ...out].some((t) => index < t.index + t.length && t.index < index + m.wrong.length);
    if (!overlaps) out.push({ index, length: m.wrong.length, fix: m.right, why: m.why, kind: "grammar" });
  }
  return out;
}

/** The examiner's corrections first, then the automatic ones it did not already cover. */
function corrections(ex: Examiner | undefined, issues: Issue[]) {
  const mine = (ex?.mistakes ?? []).map((m) => ({ original: m.wrong, fix: m.right, why: m.why }));
  const rest = issues.filter((i) => !ex?.mistakes.some((m) => m.wrong.toLowerCase().includes(i.original.toLowerCase())));
  return [...mine, ...rest.map((i) => ({ original: i.original, fix: i.fix, why: i.why }))];
}

function contractFrom(issues: Issue[]): ContractItem[] {
  const order = { grammar: 0, vocabulary: 1, spelling: 2, style: 3 } as const;
  const seen = new Set<string>();
  return issues
    .slice()
    .sort((a, b) => order[a.kind] - order[b.kind])
    .filter((i) => (seen.has(i.rule) || !i.sentence ? false : (seen.add(i.rule), true)))
    .slice(0, 3)
    .map((i) => ({ rule: i.rule, original: i.original, fix: i.fix, why: i.why, sentence: i.sentence, drill: DRILLS[i.rule] }));
}

function Next({ section, taskId, format }: { section: Skill; taskId: string; format: "academic" | "general" }) {
  const more = catalogFor(section, format).filter((c) => c.id !== taskId).slice(0, 2);
  return (
    <section className="grid gap-3 md:grid-cols-3">
      <Link href="/app" className="card flex items-center gap-3 p-5 transition hover:-translate-y-0.5">
        <span className="flex-1"><span className="block font-bold">Вернуться к плану</span><span className="text-sm text-muted">Продолжить план на сегодня</span></span><ArrowRight size={18} />
      </Link>
      {more.map((m) => (
        <Link key={m.id} href={m.href} className="card flex items-center gap-3 p-5 transition hover:-translate-y-0.5">
          <span className="min-w-0 flex-1"><span className="block truncate font-bold">{m.title}</span><span className="text-sm text-muted">Ещё тест {SECTION_RU[section]}</span></span><ArrowRight size={18} />
        </Link>
      ))}
    </section>
  );
}

function reviewed(questions: Question[], answers: Record<string, string>): ReviewedQuestion[] {
  return questions.map((q, i) => ({
    n: i + 1,
    prompt: q.prompt,
    given: answers[q.id] ?? "",
    correct: q.answer[0],
    ok: isCorrect(q, answers[q.id]),
    why: q.why,
  }));
}

export default async function Result({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await currentUser())!;
  const a = await db.attempt.findFirst({ where: { id, userId: user.id } });
  if (!a) notFound();
  const details = JSON.parse(a.details);
  const format = user.format as "academic" | "general";
  const date = a.createdAt.toLocaleDateString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

  const back = (
    <Link href={`/app/tests?skill=${a.section}`} className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
      <ArrowLeft size={16} /> К тестам {SECTION_RU[a.section]}
    </Link>
  );

  if (a.section === "reading" || a.section === "listening") {
    const test = a.section === "reading" ? getReading(a.taskId) : getListening(a.taskId);
    if (!test) notFound();
    const items = reviewed(allQuestions(test.groups), details.answers ?? {});
    return (
      <div className="grid gap-8">
        {back}
        <h1 className="display text-3xl font-bold md:text-4xl">Результаты: {SECTION_RU[a.section]}</h1>
        <Score band={a.band} target={user.targetBand} label={`${test.title} · ${date}`} sub={`${a.raw} из ${a.total} верно`} />
        <AnswerReview items={items} />
        {"passage" in test ? (
          <details className="card p-6">
            <summary className="cursor-pointer font-bold">Текст</summary>
            <h3 className="display mt-4 text-xl font-bold">{test.passage.heading}</h3>
            <div className="mt-4 grid gap-4 text-[15px] leading-[1.75]">{test.passage.paragraphs.map((p, i) => <p key={i}>{p}</p>)}</div>
          </details>
        ) : (
          <details className="card p-6">
            <summary className="cursor-pointer font-bold">Транскрипт аудио</summary>
            <dl className="mt-4 grid gap-3 text-[15px] leading-relaxed">
              {test.script.map((l, i) => (
                <div key={i} className="grid gap-0.5 sm:grid-cols-[140px_1fr] sm:gap-4">
                  <dt className="text-sm font-bold text-muted">{test.speakers[l.speaker].name}</dt><dd>{l.text}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}
        <Next section={a.section as Skill} taskId={a.taskId} format={format} />
      </div>
    );
  }

  const ex = details.examiner as Examiner | undefined;
  const waiter = details.examinerState === "pending" ? (
    <PendingRefresh check={examinerPending.bind(null, a.id)} title="Экзаменатор проверяет…" text="Оценка по дескрипторам IELTS с комментариями к каждому критерию. Обычно 10-20 секунд." />
  ) : null;

  if (a.section === "writing") {
    const prompt = getWriting(a.taskId);
    const report = details.report as TextReport;
    const text = String(details.text ?? "");
    const issues = report.issues ?? [];
    const autoMarks = issues.map((i) => ({ index: i.index, length: i.original.length, fix: i.fix, why: i.why, kind: i.kind }));
    const fixes = corrections(ex, issues);
    const target = Math.min(9, Math.max(user.targetBand, a.band + 0.5));
    return (
      <div className="grid gap-8">
        {back}
        <h1 className="display text-3xl font-bold md:text-4xl">Результаты: Writing</h1>
        <Score band={a.band} target={user.targetBand} label={`${prompt ? `${prompt.task === "task1" ? "Task 1" : "Task 2"}: ${prompt.type}` : "Writing"} · ${date}`} />
        {waiter}
        {ex && <ExaminerBlock ex={ex} />}

        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["слов", report.words],
            ["абзацев", report.paragraphs],
            ["связок", report.linkers.length],
            ["ошибок найдено", issues.length],
          ].map(([l, v]) => (
            <div key={l} className="card p-5"><dt className="text-sm text-muted">{l}</dt><dd className="display mt-1 text-3xl font-extrabold">{v}</dd></div>
          ))}
        </dl>

        <Criteria items={ex ? ex.criteria : report.criteria} />

        <section>
          <h2 className="display text-xl font-bold">Твоё эссе</h2>
          <p className="mt-1 text-sm text-muted">Подчёркнуто: <span className="font-semibold text-bad">грамматика</span>, <span className="font-semibold text-[var(--viz-1)]">лексика</span>, <span className="font-semibold">стиль</span>. Нажми на фрагмент, чтобы увидеть исправление.</p>
          <div className="card mt-4 p-6"><EssayMarkup text={text} marks={[...autoMarks, ...examinerMarks(text, ex, autoMarks)].sort((x, y) => x.index - y.index)} /></div>
        </section>

        {ex?.rewrite && <Rewrite rw={ex.rewrite} label="Слабое место, переписанное на 7.5+" />}

        {fixes.length > 0 && (
          <section>
            <h2 className="display text-xl font-bold">Исправления</h2>
            <ul className="mt-4 grid gap-3">
              {fixes.slice(0, 14).map((i, n) => (
                <li key={n} className="card grid gap-1.5 p-5">
                  <p className="text-[15px]"><span className="text-bad line-through decoration-2">{i.original}</span><ArrowRight size={14} className="mx-2 inline" /><span className="font-bold text-ok">{i.fix}</span></p>
                  <p className="text-sm text-muted">{i.why}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Contract items={contractFrom(issues)} target={target} />

        <div className="grid gap-4 md:grid-cols-2">
          <section className="card p-6">
            <h2 className="flex items-center gap-2 font-bold"><Lightning size={20} weight="fill" className="text-fire-text" /> Лексика</h2>
            {report.advanced.length ? (
              <p className="mt-3 text-sm">Сильные слова: <span className="font-semibold">{report.advanced.join(", ")}</span></p>
            ) : <p className="mt-3 text-sm text-muted">Академической лексики пока мало. Попробуй слова ниже.</p>}
            {report.repeated.length > 0 && <p className="mt-2 text-sm text-muted">Повторы: {report.repeated.map((r) => `${r.word} ×${r.count}`).join(", ")}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {["significant", "contribute to", "consequently", "a considerable number of", "outweigh"].map((w) => <AddWordButton key={w} term={w} source="writing" />)}
            </div>
          </section>
          <section className="card p-6">
            <h2 className="flex items-center gap-2 font-bold"><Lightbulb size={20} weight="fill" className="text-fire-text" /> Связность</h2>
            <p className="mt-3 text-sm">{report.linkers.length ? <>Связки в тексте: <span className="font-semibold">{report.linkers.join(", ")}</span></> : "Связок не найдено."}</p>
            <p className="mt-2 text-sm text-muted">Средняя длина предложения: {Math.round(report.avgSentence)} слов. Хорошая зона: 15-25.</p>
          </section>
        </div>

        {prompt?.chart && <section className="card p-6"><ChartView chart={prompt.chart} /></section>}
        {prompt && (
          <details className="card p-6">
            <summary className="cursor-pointer font-bold">Задание</summary>
            <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed">{prompt.text}</p>
          </details>
        )}
        {prompt?.model && (
          <details className="card p-6" open>
            <summary className="cursor-pointer font-bold">Модельный ответ на Band 8+</summary>
            <p className="mt-2 text-sm text-muted">Сравни структуру: вступление с перефразом, абзацы с главной мыслью, вывод.</p>
            <div className="mt-4 whitespace-pre-line text-[15px] leading-[1.8]">{prompt.model}</div>
          </details>
        )}
        <p className="text-sm text-muted">{ex ? "Оценку ставит ИИ-экзаменатор по официальным дескрипторам IELTS. Это ориентир: на реальном экзамене балл может отличаться на 0.5." : "Оценка автоматическая: она считает измеримые признаки текста по критериям IELTS и может отличаться от экзаменатора на 0.5-1 балла."}</p>
        <Next section="writing" taskId={a.taskId} format={format} />
      </div>
    );
  }

  // Speaking
  const task = getSpeaking(a.taskId);
  const report = details.report as SpeechReport;
  const parts = (details.parts ?? []) as { question: string; text: string; duration: number; words: { w: string; s: number; e: number; p: number }[]; timing: SpeechTiming | null }[];
  const t = report.timing;
  const unclear = [...new Set((t?.unclear ?? []).map((u) => u.word.toLowerCase()))].slice(0, 10);
  const target = Math.min(9, Math.max(user.targetBand, a.band + 0.5));
  const fillerTotal = report.fillers.reduce((s, f) => s + f.count, 0);
  const speechFixes = corrections(ex, report.issues ?? []);
  const wpmNote = report.wpm < 100 ? "медленно" : report.wpm > 170 ? "быстро" : "в норме";

  return (
    <div className="grid gap-8">
      {back}
      <h1 className="display text-3xl font-bold md:text-4xl">Результаты: Speaking</h1>
      <Score band={a.band} target={user.targetBand} label={`${task ? `Part ${task.part}: ${task.topic}` : "Speaking"} · ${date}`} />
      {waiter}
      {ex && <ExaminerBlock ex={ex} />}

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="card p-5"><dt className="text-sm text-muted">Темп, слов/мин</dt><dd className="display mt-1 text-3xl font-extrabold">{report.wpm}</dd><dd className="text-xs text-muted">норма 120-150, сейчас {wpmNote}</dd></div>
        <div className="card p-5"><dt className="text-sm text-muted">Паузы-колебания</dt><dd className="display mt-1 text-3xl font-extrabold">{t ? t.hesitations : "—"}</dd><dd className="text-xs text-muted">{t ? `длинных: ${t.longPauses}` : "нет таймкодов"}</dd></div>
        <div className="card p-5"><dt className="text-sm text-muted">Слова-паразиты</dt><dd className="display mt-1 text-3xl font-extrabold">{fillerTotal}</dd><dd className="text-xs text-muted">{report.fillers.slice(0, 3).map((f) => f.word).join(", ") || "не найдено"}</dd></div>
        <div className="card p-5"><dt className="text-sm text-muted">Слов сказано</dt><dd className="display mt-1 text-3xl font-extrabold">{report.words}</dd><dd className="text-xs text-muted">{Math.round(report.seconds)} с речи</dd></div>
      </dl>

      <Criteria items={ex ? ex.criteria : report.criteria} />

      {ex?.rewrite && <Rewrite rw={ex.rewrite} label="Как сказать на 7.5+" />}

      {unclear.length > 0 && (
        <section className="card p-6">
          <h2 className="font-bold">Послушай, как звучат эти слова</h2>
          <p className="mt-1 text-sm text-muted">Их было трудно разобрать. Послушай эталон и повтори вслух 2-3 раза.</p>
          <div className="mt-4 flex flex-wrap gap-2">{unclear.map((w) => <ListenWord key={w} word={w} audio={signTts(w, "examiner", "slow")} />)}</div>
        </section>
      )}

      <section>
        <h2 className="display text-xl font-bold">Расшифровка с таймкодами</h2>
        <p className="mt-1 text-sm text-muted">Отмечены паузы (секунды), слова-паразиты и нечётко произнесённые слова.</p>
        <div className="mt-4 grid gap-3">
          {parts.map((p, i) => (
            <article key={i} className="card p-6">
              <p className="whitespace-pre-line text-sm font-bold text-muted">{p.question.split("\n")[0]}</p>
              <div className="mt-3"><SpeechTimeline words={p.words} text={p.text} /></div>
              {p.timing && <p className="mt-3 text-xs text-muted">{Math.round(p.duration)} с · {p.timing.wpm} слов/мин · колебаний: {p.timing.hesitations}</p>}
            </article>
          ))}
        </div>
      </section>

      {speechFixes.length > 0 && (
        <section>
          <h2 className="display text-xl font-bold">Ошибки в речи</h2>
          <ul className="mt-4 grid gap-3">
            {speechFixes.slice(0, 12).map((i, n) => (
              <li key={n} className="card grid gap-1.5 p-5">
                <p className="text-[15px]"><span className="text-bad line-through decoration-2">{i.original}</span><ArrowRight size={14} className="mx-2 inline" /><span className="font-bold text-ok">{i.fix}</span></p>
                <p className="text-sm text-muted">{i.why}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Contract items={contractFrom(report.issues ?? [])} target={target} spoken />
      <p className="text-sm text-muted">{ex ? "Беглость, лексику и грамматику оценивает ИИ-экзаменатор по дескрипторам IELTS; произношение считается по уверенности распознавания речи. Это ориентир, а не официальный балл." : "Оценка автоматическая: беглость и произношение считаются по таймкодам и уверенности распознавания речи. Это ориентир, а не оценка экзаменатора."}</p>
      <Next section="speaking" taskId={a.taskId} format={format} />
    </div>
  );
}
