"use client";

import { useActionState, useState } from "react";
import { Check, Copy } from "@phosphor-icons/react";
import { deleteAccount, updateProfile, type FormState } from "@/app/actions";
import { BANDS, SKILLS, SKILL_RU } from "@/lib/profile";

type U = { name: string; goal: string; format: string; targetBand: number; focusSkill: string; dailyMinutes: number; examDate: string; emailOptIn: boolean };

const MINUTES = [15, 30, 60, 120];

export function ProfileForm({ user }: { user: U }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, undefined);
  const today = new Date().toISOString().slice(0, 10);
  const max = new Date(Date.now() + 3 * 365 * 86_400_000).toISOString().slice(0, 10);
  return (
    <form action={action} className="mt-6 grid gap-5 md:grid-cols-2">
      <div className="grid gap-2">
        <label htmlFor="p-name" className="label">Имя</label>
        <input id="p-name" name="name" defaultValue={user.name} className="field" maxLength={40} required />
      </div>
      <div className="grid gap-2" id="exam">
        <label htmlFor="p-date" className="label">Дата экзамена</label>
        <input id="p-date" name="examDate" type="date" min={today} max={max} defaultValue={user.examDate} className="field" />
        <p className="text-xs text-muted">По дате план подбирает темп и показывает, успеваешь ли ты.</p>
      </div>
      <div className="grid gap-2">
        <label htmlFor="p-goal" className="label">Для чего ты используешь LexiUp</label>
        <select id="p-goal" name="goal" defaultValue={user.goal} className="field">
          <option value="ielts">Подготовка к IELTS</option>
          <option value="english">Разговорный английский</option>
        </select>
      </div>
      <div className="grid gap-2">
        <label htmlFor="p-format" className="label">Формат IELTS</label>
        <select id="p-format" name="format" defaultValue={user.format} className="field">
          <option value="academic">Academic</option>
          <option value="general">General Training</option>
        </select>
      </div>
      <div className="grid gap-2">
        <label htmlFor="p-band" className="label">Целевой балл</label>
        <select id="p-band" name="targetBand" defaultValue={String(user.targetBand)} className="field">
          {[5, 5.5, ...BANDS.filter((b) => b > 5.5)].map((b) => <option key={b} value={b}>{b.toFixed(1)}</option>)}
        </select>
      </div>
      <div className="grid gap-2">
        <label htmlFor="p-skill" className="label">Главный фокус</label>
        <select id="p-skill" name="focusSkill" defaultValue={user.focusSkill} className="field">
          {SKILLS.map((s) => <option key={s} value={s}>{SKILL_RU[s]}</option>)}
        </select>
      </div>
      <div className="grid gap-2">
        <label htmlFor="p-min" className="label">Время занятий в день</label>
        <select id="p-min" name="dailyMinutes" defaultValue={String(user.dailyMinutes)} className="field">
          {[...new Set([...MINUTES, user.dailyMinutes])].sort((a, b) => a - b).map((m) => <option key={m} value={m}>{m >= 60 ? `${m / 60} ч` : `${m} минут`}</option>)}
        </select>
        <p className="text-xs text-muted">План на завтра обновится под новое время.</p>
      </div>
      <label className="flex items-center gap-3 text-[15px] md:col-span-2">
        <input type="checkbox" name="emailOptIn" defaultChecked={user.emailOptIn} className="size-5 accent-[var(--fire)]" />
        Получать советы и напоминания на почту
      </label>
      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <button disabled={pending} className="btn btn-fire">{pending ? "Сохраняем…" : "Сохранить"}</button>
        {state?.ok && <p role="status" className="inline-flex items-center gap-1 text-sm font-semibold text-ok"><Check size={16} weight="bold" /> Сохранено</p>}
        {state?.error && <p role="alert" className="text-sm font-semibold text-bad">{state.error}</p>}
      </div>
    </form>
  );
}

export function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      <input readOnly value={link} className="field max-w-md flex-1 text-sm" aria-label="Твоя ссылка" onFocus={(e) => e.currentTarget.select()} />
      <button
        type="button"
        onClick={async () => {
          try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
        }}
        className="btn btn-ink"
      >
        {copied ? <Check size={16} weight="bold" /> : <Copy size={16} />} {copied ? "Скопировано" : "Копировать"}
      </button>
    </div>
  );
}

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(deleteAccount, undefined);
  if (!open) {
    return <button onClick={() => setOpen(true)} className="w-fit text-sm font-semibold text-muted underline underline-offset-4 hover:text-bad">Удалить аккаунт</button>;
  }
  return (
    <form action={action} className="card grid max-w-lg gap-3 border-bad/30 p-6">
      <p className="font-bold">Удалить аккаунт?</p>
      <p className="text-sm text-muted">Профиль, результаты тестов, словарь и разговоры удалятся сразу и навсегда. Чтобы подтвердить, введи свой email.</p>
      <label htmlFor="del-email" className="label">Email</label>
      <input id="del-email" name="email" type="email" className="field" autoComplete="email" required />
      {state?.error && <p role="alert" className="text-sm font-semibold text-bad">{state.error}</p>}
      <div className="flex gap-2">
        <button disabled={pending} className="btn btn-sm bg-bad text-white hover:brightness-110">{pending ? "Удаляем…" : "Удалить навсегда"}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">Отмена</button>
      </div>
    </form>
  );
}
