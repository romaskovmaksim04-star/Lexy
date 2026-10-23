"use client";

import { useCalm } from "@/lib/motion-pref";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft, ArrowRight, BookOpenText, Briefcase, CalendarBlank, CheckCircle, Exam, GraduationCap, Headphones,
  Microphone, PencilLine, Translate,
} from "@phosphor-icons/react";
import { Mascot } from "@/components/ui/Mascot";
import { signup } from "@/app/actions";
import { Wheel } from "./Wheel";
import { BANDS, EXPERIENCE, MINUTES, SKILL_HINT, WINDOWS, WORRIES, type Skill } from "@/lib/profile";

type Answers = {
  goal?: string; format?: string; targetBand?: number; focusSkill?: Skill; examWindow?: string;
  experience?: string; dailyMinutes?: number; worry?: string;
};
type Option = { value: string | number; label: string; hint?: string; icon?: React.ReactNode };
type Step = { key: keyof Answers; say: string; title: string; options: Option[]; grid?: boolean; skip?: (a: Answers) => boolean };

const STEPS: Step[] = [
  {
    key: "goal", say: "Привет! Я Лекси.", title: "С чего начнём?",
    options: [
      { value: "ielts", label: "Подготовка к IELTS", hint: "План под нужный балл", icon: <Exam size={26} weight="duotone" /> },
      { value: "english", label: "Просто английский", hint: "Те же тренажёры без экзаменного таймера", icon: <Translate size={26} weight="duotone" /> },
    ],
  },
  {
    key: "format", say: "Формат влияет на Reading и Writing.", title: "Какой формат тебе нужен?",
    skip: (a) => a.goal === "english",
    options: [
      { value: "academic", label: "Academic", hint: "Для учёбы в университете", icon: <GraduationCap size={26} weight="duotone" /> },
      { value: "general", label: "General Training", hint: "Для работы и переезда", icon: <Briefcase size={26} weight="duotone" /> },
    ],
  },
  {
    key: "targetBand", say: "Смотри в требованиях вуза или визы.", title: "Какой балл тебе нужен?", grid: true,
    options: BANDS.map((b) => ({ value: b, label: b.toFixed(1) })),
  },
  {
    key: "focusSkill", say: "На неё уйдёт больше времени в плане.", title: "Какую секцию прокачать первой?",
    options: [
      { value: "speaking", label: "Speaking", hint: SKILL_HINT.speaking, icon: <Microphone size={26} weight="duotone" /> },
      { value: "writing", label: "Writing", hint: SKILL_HINT.writing, icon: <PencilLine size={26} weight="duotone" /> },
      { value: "reading", label: "Reading", hint: SKILL_HINT.reading, icon: <BookOpenText size={26} weight="duotone" /> },
      { value: "listening", label: "Listening", hint: SKILL_HINT.listening, icon: <Headphones size={26} weight="duotone" /> },
    ],
  },
  {
    key: "examWindow", say: "Под дату я подгоню темп.", title: "Когда планируешь сдавать?",
    skip: (a) => a.goal === "english",
    options: WINDOWS.map((w) => ({ value: w.value, label: w.label, icon: <CalendarBlank size={24} weight="duotone" /> })),
  },
  {
    key: "experience", say: "Чтобы не объяснять то, что ты уже знаешь.", title: "Это твой первый IELTS?",
    skip: (a) => a.goal === "english",
    options: EXPERIENCE.map((e) => ({ value: e.value, label: e.label })),
  },
  {
    key: "dailyMinutes", say: "Регулярность важнее длины.", title: "Сколько времени в день готов уделять?", grid: true,
    options: MINUTES.map((m) => ({ value: m.value, label: m.label })),
  },
  {
    key: "worry", say: "Последний вопрос, честно.", title: "Что беспокоит больше всего?",
    options: WORRIES.map((w) => ({ value: w.value, label: w.label })),
  },
];

const WORRY_ANSWER: Record<string, string> = {
  fail: "Каждый ответ получает оценку, так что ты заранее увидишь, хватает ли баллов.",
  money: "Пробные задания каждый день, чтобы на экзамен идти один раз.",
  time: "План уже разложен по дням, остаётся только открыть его.",
  confidence: "Speaking тренируем голосом с таймером, как на настоящем экзамене.",
};

export function Quiz({ refCode, plan }: { refCode?: string; plan?: string }) {
  const reduce = useCalm();
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [pending, start] = useTransition();
  const [error, setError] = useState<{ error?: string; field?: string }>();
  const [wheel, setWheel] = useState("");

  const steps = useMemo(() => STEPS.filter((s) => !s.skip?.(answers)), [answers]);
  const total = steps.length + 4; // analysis + summary + wheel + account
  const atAnalysis = index === steps.length;
  const atSummary = index === steps.length + 1;
  const atWheel = index === steps.length + 2;
  const atAccount = index === steps.length + 3;
  const step = steps[index];

  const go = (d: number) => {
    setDir(d);
    setIndex((i) => Math.max(0, Math.min(total - 1, i + d)));
  };

  const choose = (key: keyof Answers, value: string | number) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    setTimeout(() => go(1), reduce ? 0 : 180);
  };

  const submit = (form: FormData) => {
    setError(undefined);
    start(async () => {
      const res = await signup({
        ...answers,
        name: form.get("name"), email: form.get("email"), password: form.get("password"),
        wheel, ref: refCode, plan,
      });
      if (res?.error) setError(res);
    });
  };

  const examWin = WINDOWS.find((w) => w.value === answers.examWindow);
  const variants = {
    enter: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * 48 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * -48 }),
  };
  const say = atAnalysis ? "Секунду, считаю." : atSummary ? "Готово, вот что получилось." : atWheel ? "А теперь бонус!" : atAccount ? "Сохраню план в твой аккаунт." : step.say;

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col px-4 pb-10 pt-4">
      <div className="flex h-14 items-center gap-3">
        {index > 0 ? (
          <button type="button" onClick={() => go(-1)} aria-label="Назад" className="grid size-10 place-items-center rounded-full hover:bg-surface-2">
            <ArrowLeft size={20} weight="bold" />
          </button>
        ) : (
          <Link href="/" aria-label="На главную" className="grid size-10 place-items-center rounded-full hover:bg-surface-2">
            <ArrowLeft size={20} weight="bold" />
          </Link>
        )}
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index + 1}>
          <motion.div className="h-full rounded-full bg-fire" animate={{ width: `${((index + 1) / total) * 100}%` }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} />
        </div>
        <span className="w-12 text-right text-sm font-semibold tabular-nums text-muted">{index + 1}/{total}</span>
      </div>

      <div className="mt-6 flex items-end gap-3">
        <Mascot animated className="w-14 shrink-0" title="" />
        <AnimatePresence mode="wait">
          <motion.p
            key={say}
            initial={reduce ? false : { opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="mb-3 rounded-2xl rounded-bl-md bg-surface px-4 py-2.5 text-[15px] font-medium shadow-sm ring-1 ring-line"
          >
            {say}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="relative mt-8 flex-1">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={atAnalysis ? "analysis" : atSummary ? "summary" : atWheel ? "wheel" : atAccount ? "account" : step.key}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {atAnalysis && <Analysis onDone={() => go(1)} />}

            {atWheel && (
              <>
                <h1 className="display text-center text-[28px] font-bold leading-tight md:text-4xl">Крути и открой свою скидку</h1>
                <p className="mx-auto mt-3 max-w-[40ch] text-center text-muted">Один раз, на первый месяц занятий.</p>
                <div className="mt-8"><Wheel onWin={(_, token) => { setWheel(token); go(1); }} /></div>
              </>
            )}

            {step && !atAnalysis && !atSummary && !atWheel && !atAccount && (
              <>
                <h1 className="display text-[28px] font-bold leading-tight md:text-4xl">{step.title}</h1>
                <div className={`mt-8 grid gap-3 ${step.grid ? "grid-cols-2 sm:grid-cols-4" : ""}`}>
                  {step.options.map((o) => {
                    const active = answers[step.key] === o.value;
                    return (
                      <button
                        key={String(o.value)}
                        type="button"
                        onClick={() => choose(step.key, o.value)}
                        className={`flex items-center gap-4 rounded-3xl border-2 p-5 text-left transition active:scale-[0.98] ${
                          active ? "border-fire bg-fire-soft" : "border-line bg-surface hover:border-ink/25"
                        } ${step.grid ? "justify-center py-6" : ""}`}
                      >
                        {o.icon && <span className="text-fire-text">{o.icon}</span>}
                        <span>
                          <span className={`block font-bold ${step.grid ? "display text-xl" : "text-lg"}`}>{o.label}</span>
                          {o.hint && <span className="mt-0.5 block text-sm text-muted">{o.hint}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {atSummary && (
              <>
                <h1 className="display text-[28px] font-bold leading-tight md:text-4xl">Твой план готов</h1>
                <div className="mt-8 grid grid-cols-2 gap-3">
                  <div className="col-span-2 rounded-3xl bg-fire p-6 text-[#1b1433]">
                    <p className="text-sm font-bold">Цель</p>
                    <p className="display mt-1 text-5xl font-extrabold">{(answers.targetBand ?? 6.5).toFixed(1)}</p>
                    <p className="mt-2 font-medium">
                      {answers.goal === "english" ? "Английский для жизни" : answers.format === "general" ? "IELTS General Training" : "IELTS Academic"}
                      {examWin?.days ? `, примерно ${examWin.days} дней до экзамена` : ""}
                    </p>
                  </div>
                  <div className="card p-5">
                    <p className="text-sm text-muted">Упор на</p>
                    <p className="mt-1 text-lg font-bold capitalize">{answers.focusSkill ?? "speaking"}</p>
                  </div>
                  <div className="card p-5">
                    <p className="text-sm text-muted">Каждый день</p>
                    <p className="mt-1 text-lg font-bold">{MINUTES.find((m) => m.value === answers.dailyMinutes)?.label ?? "30 минут"}</p>
                  </div>
                  <div className="card col-span-2 p-5">
                    <p className="text-sm text-muted">Про твоё беспокойство</p>
                    <p className="mt-1 font-medium">{WORRY_ANSWER[answers.worry ?? "confidence"]}</p>
                  </div>
                </div>
                <button type="button" onClick={() => go(1)} className="btn btn-fire mt-8 w-full py-4 text-base">
                  Сохранить план <ArrowRight size={18} weight="bold" />
                </button>
              </>
            )}

            {atAccount && (
              <>
                <h1 className="display text-[28px] font-bold leading-tight md:text-4xl">Создай аккаунт</h1>
                <p className="mt-3 text-muted">Так прогресс и серия дней не потеряются.</p>
                <form action={submit} className="mt-8 grid gap-5" noValidate>
                  <Field name="name" label="Имя" autoComplete="given-name" error={error} />
                  <Field name="email" label="Email" type="email" autoComplete="email" error={error} />
                  <Field name="password" label="Пароль" type="password" autoComplete="new-password" hint="Минимум 8 символов" error={error} />
                  {error?.error && !["name", "email", "password"].includes(error.field ?? "") && (
                    <p className="text-sm font-medium text-bad" role="alert">{error.error}</p>
                  )}
                  <button type="submit" disabled={pending} className="btn btn-fire mt-2 w-full py-4 text-base">
                    {pending ? "Создаю аккаунт…" : "Начать заниматься"}
                  </button>
                  <p className="text-center text-sm text-muted">
                    Уже есть аккаунт? <Link href="/login" className="font-semibold text-ink underline underline-offset-4">Войти</Link>
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

const CHECKS = ["Анализируем твои ответы", "Подбираем задания под твой уровень", "Собираем план под твою дату"];

function Analysis({ onDone }: { onDone: () => void }) {
  const reduce = useCalm();
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (done >= CHECKS.length) {
      const t = setTimeout(onDone, reduce ? 100 : 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDone((d) => d + 1), reduce ? 150 : 900);
    return () => clearTimeout(t);
  }, [done, onDone, reduce]);
  return (
    <>
      <h1 className="display text-[28px] font-bold leading-tight md:text-4xl">Готовим твой план…</h1>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-surface-2">
        <motion.div className="h-full rounded-full bg-fire" animate={{ width: `${(done / CHECKS.length) * 100}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
      </div>
      <ul className="mt-8 grid gap-4" aria-live="polite">
        {CHECKS.map((c, i) => (
          <li key={c} className={`flex items-center gap-3 text-lg font-semibold transition ${i < done ? "" : "opacity-40"}`}>
            {i < done ? <CheckCircle size={26} weight="fill" className="text-ok" /> : <span className="size-[26px] animate-pulse rounded-full border-2 border-line calm:animate-none" />}
            {c}
          </li>
        ))}
      </ul>
    </>
  );
}

function Field({ name, label, type = "text", autoComplete, hint, error }: {
  name: string; label: string; type?: string; autoComplete?: string; hint?: string; error?: { error?: string; field?: string };
}) {
  const bad = error?.field === name;
  return (
    <div className="grid gap-2">
      <label htmlFor={name} className="label">{label}</label>
      <input
        id={name} name={name} type={type} autoComplete={autoComplete} required
        aria-invalid={bad} aria-describedby={`${name}-help`}
        className={`field ${bad ? "border-bad focus:border-bad focus:ring-bad/20" : ""}`}
      />
      <p id={`${name}-help`} className={`text-sm ${bad ? "font-medium text-bad" : "text-muted"}`}>{bad ? error?.error : hint ?? ""}</p>
    </div>
  );
}
