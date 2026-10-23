"use client";

import type { Question, QuestionGroup } from "@/lib/content/types";

const TF = ["TRUE", "FALSE", "NOT GIVEN"];
const YN = ["YES", "NO", "NOT GIVEN"];

function Choice({ q, value, onChange, options, letters }: { q: Question; value?: string; onChange: (v: string) => void; options: string[]; letters?: boolean }) {
  return (
    <div role="radiogroup" aria-label={q.prompt} className={letters ? "mt-3 grid gap-2" : "mt-3 flex flex-wrap gap-2"}>
      {options.map((o) => {
        const v = letters ? o.trim().split(/\s+/)[0] : o;
        const on = value === v;
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(v)}
            className={`rounded-2xl border px-4 py-2.5 text-left text-[15px] font-medium transition ${on ? "border-fire bg-fire-soft text-ink ring-2 ring-fire/30" : "border-line bg-surface hover:border-ink/30"}`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function QuestionGroups({
  groups, answers, onAnswer, numberFrom = 1,
}: { groups: QuestionGroup[]; answers: Record<string, string>; onAnswer: (id: string, v: string) => void; numberFrom?: number }) {
  let n = numberFrom - 1;
  return (
    <div className="grid gap-8">
      {groups.map((g) => (
        <section key={g.title}>
          <h3 className="font-bold">{g.title}</h3>
          <p className="mt-1 text-sm text-muted">{g.instructions}</p>
          <ol className="mt-4 grid gap-5">
            {g.questions.map((q) => {
              n += 1;
              return (
                <li key={q.id} id={`q-${q.id}`} className="scroll-mt-28">
                  <p className="text-[15px] leading-relaxed"><span className="mr-2 font-bold text-fire-text">{n}</span>{q.prompt}</p>
                  {q.kind === "tfng" && <Choice q={q} value={answers[q.id]} onChange={(v) => onAnswer(q.id, v)} options={TF} />}
                  {q.kind === "ynng" && <Choice q={q} value={answers[q.id]} onChange={(v) => onAnswer(q.id, v)} options={YN} />}
                  {q.kind === "mcq" && <Choice q={q} value={answers[q.id]} onChange={(v) => onAnswer(q.id, v)} options={q.options ?? []} letters />}
                  {q.kind === "gap" && (
                    <input
                      className="field mt-3 max-w-xs"
                      aria-label={`Ответ на вопрос ${n}`}
                      autoComplete="off"
                      spellCheck={false}
                      value={answers[q.id] ?? ""}
                      onChange={(e) => onAnswer(q.id, e.target.value)}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

export function useTimerLabel(seconds: number) {
  const m = Math.floor(Math.abs(seconds) / 60);
  const s = Math.abs(seconds) % 60;
  return `${seconds < 0 ? "-" : ""}${m}:${String(s).padStart(2, "0")}`;
}
