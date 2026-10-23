"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookmarkSimple, HighlighterCircle } from "@phosphor-icons/react";
import type { ReadingTest } from "@/lib/content/types";
import { allQuestions } from "@/lib/content/types";
import { QuestionGroups } from "@/components/app/Questions";
import { TestBar } from "@/components/app/TestBar";
import { addWord, submitTest } from "@/app/actions";

type Pop = { x: number; y: number; text: string; range: Range };

export function ReadingRunner({ test }: { test: ReadingTest }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"text" | "questions">("text");
  const [pop, setPop] = useState<Pop | null>(null);
  const [toast, setToast] = useState("");
  const [sending, setSending] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const started = useRef(Date.now());
  const passage = useRef<HTMLDivElement>(null);
  const total = allQuestions(test.groups).length;
  const answered = Object.values(answers).filter((v) => v.trim()).length;

  // Keep answers if the page is reloaded mid-test
  const key = `lexy-reading-${test.id}`;
  useEffect(() => {
    try { const saved = sessionStorage.getItem(key); if (saved) setAnswers(JSON.parse(saved)); } catch { /* private mode */ }
  }, [key]);
  useEffect(() => {
    try { sessionStorage.setItem(key, JSON.stringify(answers)); } catch { /* private mode */ }
  }, [answers, key]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const onSelect = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !passage.current) return setPop(null);
    const range = sel.getRangeAt(0);
    if (!passage.current.contains(range.commonAncestorContainer)) return setPop(null);
    const text = sel.toString().trim();
    if (!text || text.length > 300) return setPop(null);
    const rect = range.getBoundingClientRect();
    setPop({ x: rect.left + rect.width / 2, y: rect.top, text, range: range.cloneRange() });
  };

  const highlight = () => {
    if (!pop) return;
    try {
      const mark = document.createElement("mark");
      mark.className = "rounded bg-fire-soft px-0.5 text-ink";
      mark.title = "Нажми, чтобы убрать выделение";
      mark.onclick = () => mark.replaceWith(...Array.from(mark.childNodes));
      pop.range.surroundContents(mark);
    } catch {
      setToast("Выдели фрагмент внутри одного абзаца");
    }
    window.getSelection()?.removeAllRanges();
    setPop(null);
  };

  const save = async () => {
    if (!pop) return;
    const words = pop.text.split(/\s+/).length;
    if (words > 3) {
      setToast("Для карточки выдели 1-3 слова");
      return;
    }
    const sentence = pop.range.startContainer.textContent ?? "";
    const r = await addWord(pop.text, "", sentence.slice(0, 280), "reading");
    setToast(r.ok ? `«${pop.text}» в словаре` : r.error ?? "Не удалось сохранить");
    window.getSelection()?.removeAllRanges();
    setPop(null);
  };

  const finish = async () => {
    if (answered < total && !confirm) {
      setConfirm(true);
      return;
    }
    setSending(true);
    const minutes = (Date.now() - started.current) / 60000;
    const r = await submitTest("reading", test.id, answers, minutes);
    try { sessionStorage.removeItem(key); } catch { /* private mode */ }
    router.push(`/app/results/${r.id}`);
  };

  return (
    <div>
      <TestBar title={test.title} minutes={test.minutes} answered={answered} total={total} onSubmit={finish} submitting={sending} />

      <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-surface-2 p-1 lg:hidden" role="tablist">
        {(["text", "questions"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`rounded-full py-2 text-sm font-bold transition ${tab === t ? "bg-surface shadow-sm" : "text-muted"}`}>
            {t === "text" ? "Текст" : `Вопросы ${answered}/${total}`}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <article
          ref={passage}
          onMouseUp={onSelect}
          onTouchEnd={() => setTimeout(onSelect, 50)}
          className={`${tab === "text" ? "block" : "hidden"} lg:sticky lg:top-24 lg:block lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto lg:pr-4`}
        >
          <h2 className="display text-2xl font-bold">{test.passage.heading}</h2>
          <p className="mt-2 text-sm text-muted">Выдели слово или фразу, чтобы подсветить или сохранить в карточки.</p>
          <div className="mt-6 grid gap-4 text-[16px] leading-[1.75]">
            {test.passage.paragraphs.map((p, i) => (
              <p key={i}><span className="mr-2 align-top text-xs font-bold text-muted">{String.fromCharCode(65 + i)}</span>{p}</p>
            ))}
          </div>
        </article>

        <div className={`${tab === "questions" ? "block" : "hidden"} lg:block`}>
          <QuestionGroups groups={test.groups} answers={answers} onAnswer={(id, v) => { setAnswers((a) => ({ ...a, [id]: v })); setConfirm(false); }} />
          {confirm && (
            <div role="alert" className="mt-8 rounded-3xl bg-fire-soft p-5">
              <p className="font-bold">Есть неотвеченные вопросы</p>
              <p className="mt-1 text-sm">Ты ответил(а) на {answered} из {total}. На экзамене за пустой ответ баллов не дают, лучше угадать.</p>
              <div className="mt-4 flex gap-2">
                <button onClick={finish} className="btn btn-ink btn-sm">Всё равно отправить</button>
                <button onClick={() => setConfirm(false)} className="btn btn-ghost btn-sm">Продолжить</button>
              </div>
            </div>
          )}
          <button onClick={finish} disabled={sending} className="btn btn-fire mt-8 w-full sm:w-auto">{sending ? "Проверяем…" : "Проверить ответы"}</button>
        </div>
      </div>

      {pop && (
        <div
          role="toolbar"
          aria-label="Действия с выделенным"
          className="fixed z-50 flex -translate-x-1/2 -translate-y-full gap-1 rounded-full border border-line bg-surface p-1 shadow-lg"
          style={{ left: pop.x, top: pop.y - 8 }}
        >
          <button onMouseDown={(e) => e.preventDefault()} onClick={highlight} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-surface-2">
            <HighlighterCircle size={16} weight="fill" className="text-fire-text" /> Выделить
          </button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={save} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-surface-2">
            <BookmarkSimple size={16} weight="fill" className="text-fire-text" /> В карточки
          </button>
        </div>
      )}
      {toast && <p role="status" className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-bg lg:bottom-8">{toast}</p>}
    </div>
  );
}
