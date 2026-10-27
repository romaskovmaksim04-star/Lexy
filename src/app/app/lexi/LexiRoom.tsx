"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Fire, SpeakerHigh, Translate } from "@phosphor-icons/react";
import { Mascot } from "@/components/ui/Mascot";
import { playVoice, unlockAudio } from "@/components/app/voice-client";
import { lexiSample } from "@/app/actions";
import { LexiCall, type CallSetup } from "./LexiCall";
import { LexiLive } from "./LexiLive";

// The Lexi page: pick a character and how Lexi talks, then the call (LexiLive, or LexiCall
// when the live call is not available). No topic and no voice to choose: Lexi has one voice,
// and she leads the conversation from where the student left off.

type PersonaCard = { id: string; name: string; tagline: string; sample: string; voice: string };
export type LexiPrefs = { lang: "mix" | "en"; swear: boolean };

export function LexiRoom({
  personas, initialPersona, prefs, secondsLeft,
}: {
  personas: PersonaCard[];
  initialPersona: string;
  prefs: LexiPrefs;
  secondsLeft: number;
}) {
  const [persona, setPersona] = useState(personas.some((p) => p.id === initialPersona) ? initialPersona : personas[0].id);
  const [lang, setLang] = useState(prefs.lang);
  const [swear, setSwear] = useState(prefs.swear);
  // "call" is the live call; "step" the step-by-step one it falls back to
  const [phase, setPhase] = useState<"pick" | "call" | "step" | "rest">(secondsLeft > 0 ? "pick" : "rest");
  const [setup, setSetup] = useState<CallSetup | null>(null);

  const p = personas.find((x) => x.id === persona)!;
  const title = p.name;

  const begin = () => {
    unlockAudio(); // inside the click, so the browser allows Lexi's voice
    setSetup({ persona, topic: "auto", voice: "", lang, swear });
    setPhase("call");
  };

  if (phase === "rest") {
    return (
      <div className="card grid place-items-center gap-4 px-6 py-16 text-center">
        <Mascot className="w-24 opacity-80" />
        <h1 className="display text-2xl font-bold">Lexi отдыхает</h1>
        <p className="max-w-[44ch] text-muted">Минуты разговора на сегодня закончились, завтра Lexi снова на связи. С Pro разговоров намного больше.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/pricing" className="btn btn-fire">Тарифы</Link>
          <Link href="/app" className="btn btn-ghost">На главную</Link>
        </div>
      </div>
    );
  }

  if (phase === "call" && setup) {
    return <LexiLive setup={setup} title={title} onLimit={() => setPhase("rest")} onFallback={() => setPhase("step")} />;
  }
  if (phase === "step" && setup) {
    return <LexiCall setup={setup} title={title} onLimit={() => setPhase("rest")} />;
  }

  const sample = async (personaId: string) => playVoice(await lexiSample(personaId));

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="display text-3xl font-bold md:text-4xl">Поговори с Lexi</h1>
        <p className="mt-2 max-w-[60ch] text-muted">Звонок с живым репетитором: говоришь вслух, Lexi слушает, реагирует, поправляет ошибки на ходу, а в конце пишет разбор по критериям IELTS. Тему выбирать не нужно: Lexi помнит прошлые разговоры и продолжит с того места, где вы остановились.</p>
      </div>

      <fieldset>
        <legend className="label">Характер</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map((x) => {
            const on = x.id === persona;
            return (
              <label key={x.id} className={`card relative flex cursor-pointer gap-4 p-5 transition ${on ? "ring-2 ring-fire" : "hover:-translate-y-0.5"}`}>
                <input type="radio" name="persona" value={x.id} checked={on} onChange={() => setPersona(x.id)} className="sr-only" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 font-bold">{x.id === "roast" && <Fire size={16} weight="fill" className="text-fire" />}{x.name}</span>
                  <span className="mt-0.5 block text-sm text-muted">{x.tagline}</span>
                  <span className="mt-3 block text-[15px] italic">“{x.sample}”</span>
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); unlockAudio(); sample(x.id); }}
                  className="grid size-10 shrink-0 place-items-center self-start rounded-full bg-surface-2 text-ink transition hover:bg-fire-soft hover:text-fire-text"
                  aria-label={`Послушать: ${x.name}`}
                >
                  <SpeakerHigh size={20} weight="fill" />
                </button>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid items-start gap-4 lg:grid-cols-2">
          <fieldset>
            <legend className="label">Как говорит Lexi</legend>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {([["mix", "По-русски", "Объясняет по-русски, практика на английском"], ["en", "Only English", "Как на настоящем экзамене"]] as const).map(([v, name, hint]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setLang(v)}
                  aria-pressed={lang === v}
                  className={`card p-4 text-left transition ${lang === v ? "ring-2 ring-fire" : "hover:-translate-y-0.5"}`}
                >
                  <span className="flex items-center gap-1.5 font-bold"><Translate size={16} />{name}</span>
                  <span className="mt-1 block text-xs text-muted">{hint}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <label className="card flex cursor-pointer items-center justify-between gap-4 p-4">
            <span>
              <span className="block font-bold">Без цензуры 16+</span>
              <span className="block text-xs text-muted">Lexi матерится, срывается и не стесняется в выражениях. Особенно в «Прожарке».</span>
            </span>
            <input type="checkbox" checked={swear} onChange={(e) => setSwear(e.target.checked)} className="size-5 shrink-0 accent-[var(--fire)]" />
          </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button onClick={begin} className="btn btn-fire px-7 py-4 text-base">
          Позвонить Lexi <ArrowRight size={18} weight="bold" />
        </button>
        <p className="text-sm text-muted">Осталось сегодня: {Math.floor(secondsLeft / 60)} мин · {p.name}</p>
      </div>
    </div>
  );
}
