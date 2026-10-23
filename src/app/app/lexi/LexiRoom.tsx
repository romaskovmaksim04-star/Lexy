"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Fire, PencilSimple, SpeakerHigh, Translate } from "@phosphor-icons/react";
import { Mascot } from "@/components/ui/Mascot";
import { playVoice, unlockAudio } from "@/components/app/voice-client";
import { lexiSample } from "@/app/actions";
import { LexiCall, type CallSetup } from "./LexiCall";

// The Lexi page: pick a character, a voice and a topic, then the call (LexiCall).

type PersonaCard = { id: string; name: string; tagline: string; sample: string; voice: string };
type VoiceCard = { id: string; hint: string; female: boolean };
export type LexiPrefs = { voice: string; lang: "mix" | "en"; swear: boolean };

export function LexiRoom({
  personas, voices, topics, initialPersona, prefs, secondsLeft,
}: {
  personas: PersonaCard[];
  voices: VoiceCard[];
  topics: { id: string; title: string }[];
  initialPersona: string;
  prefs: LexiPrefs;
  secondsLeft: number;
}) {
  const [persona, setPersona] = useState(personas.some((p) => p.id === initialPersona) ? initialPersona : personas[0].id);
  const [topic, setTopic] = useState(topics[0].id);
  const [customTitle, setCustomTitle] = useState("");
  const [voice, setVoice] = useState(prefs.voice); // "" = the character's own voice
  const [lang, setLang] = useState(prefs.lang);
  const [swear, setSwear] = useState(prefs.swear);
  const [phase, setPhase] = useState<"pick" | "call" | "rest">(secondsLeft > 0 ? "pick" : "rest");
  const [setup, setSetup] = useState<CallSetup | null>(null);
  const [notice, setNotice] = useState("");

  const p = personas.find((x) => x.id === persona)!;
  const custom = topic === "custom";
  const title = custom ? customTitle.trim() || "своя тема" : topics.find((t) => t.id === topic)?.title ?? "";

  const begin = () => {
    if (custom && customTitle.trim().length < 2) {
      setNotice("Напиши, о чём хочешь поговорить.");
      return;
    }
    unlockAudio(); // inside the click, so the browser allows Lexi's voice
    setNotice("");
    setSetup({ persona, topic, topicTitle: custom ? customTitle.trim() : undefined, voice, lang, swear });
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
    return <LexiCall setup={setup} title={title} onLimit={() => setPhase("rest")} />;
  }

  const sample = async (personaId: string, voiceId: string) => playVoice(await lexiSample(personaId, voiceId));

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="display text-3xl font-bold md:text-4xl">Поговори с Lexi</h1>
        <p className="mt-2 max-w-[60ch] text-muted">Звонок с живым репетитором: говоришь вслух, Lexi слушает, реагирует, поправляет ошибки на ходу, а в конце пишет разбор по критериям IELTS.</p>
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
                  onClick={(e) => { e.preventDefault(); unlockAudio(); sample(x.id, voice || x.voice); }}
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

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <fieldset>
          <legend className="label">Голос</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setVoice("")}
              aria-pressed={voice === ""}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${voice === "" ? "border-fire bg-fire-soft text-fire-text" : "border-line bg-surface text-muted hover:text-ink"}`}
            >
              Голос характера
            </button>
            {voices.map((v) => (
              <span key={v.id} className={`inline-flex items-center rounded-full border text-sm font-semibold transition ${voice === v.id ? "border-fire bg-fire-soft text-fire-text" : "border-line bg-surface text-muted hover:text-ink"}`}>
                <button type="button" onClick={() => { setVoice(v.id); unlockAudio(); sample(persona, v.id); }} aria-pressed={voice === v.id} className="py-2 pl-4 pr-2">
                  {v.female ? "♀" : "♂"} {v.hint}
                </button>
                <button type="button" onClick={() => { unlockAudio(); sample(persona, v.id); }} className="grid size-8 place-items-center rounded-full pr-1 hover:text-fire-text" aria-label={`Послушать голос ${v.hint}`}>
                  <SpeakerHigh size={15} weight="fill" />
                </button>
              </span>
            ))}
          </div>
        </fieldset>

        <div className="grid content-start gap-4">
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
      </div>

      <fieldset>
        <legend className="label">Тема</legend>
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {topics.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTopic(t.id)}
              aria-pressed={t.id === topic}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${t.id === topic ? "border-fire bg-fire-soft text-fire-text" : "border-line bg-surface text-muted hover:text-ink"}`}
            >
              {t.title}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setTopic("custom")}
            aria-pressed={custom}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-dashed px-4 py-2 text-sm font-semibold transition ${custom ? "border-fire bg-fire-soft text-fire-text" : "border-line bg-surface text-muted hover:text-ink"}`}
          >
            <PencilSimple size={15} /> Своя тема
          </button>
        </div>
        {custom && (
          <div className="mt-3 max-w-xl">
            <label htmlFor="custom-topic" className="sr-only">Своя тема</label>
            <input
              id="custom-topic"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              maxLength={80}
              autoFocus
              placeholder="Например: Dota 2, переезд в Германию, моя кошка"
              className="field"
            />
            <p className="mt-1.5 text-xs text-muted">О чём угодно: Lexi сама придумает вопросы от простых к сложным, как на экзамене.</p>
          </div>
        )}
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <button onClick={begin} className="btn btn-fire px-7 py-4 text-base">
          Позвонить Lexi <ArrowRight size={18} weight="bold" />
        </button>
        <p className="text-sm text-muted">Осталось сегодня: {Math.floor(secondsLeft / 60)} мин · {p.name}</p>
      </div>
      {notice && <p role="alert" className="text-sm font-semibold text-bad">{notice}</p>}
    </div>
  );
}
