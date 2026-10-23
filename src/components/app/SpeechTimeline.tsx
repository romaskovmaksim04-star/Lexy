"use client";

import { Fragment } from "react";
import { SpeakerHigh } from "@phosphor-icons/react";
import { playVoice } from "@/components/app/voice-client";

type W = { w: string; s: number; e: number; p: number };

const FILLERS = new Set(["um", "umm", "uh", "uhh", "er", "erm", "ah", "hmm", "mm", "eh"]);
const clean = (w: string) => w.toLowerCase().replace(/[^a-z']/g, "");

/** A timed transcript: fillers, unclear words and pauses are marked where they happened. */
export function SpeechTimeline({ words, text }: { words: W[]; text: string }) {
  if (!words.length) return <p className="text-[15px] leading-relaxed">{text || "Расшифровка недоступна для этой части."}</p>;
  return (
    <p className="text-[16px] leading-[2]">
      {words.map((w, i) => {
        const prev = words[i - 1];
        const gap = prev ? w.s - prev.e : 0;
        const boundary = prev && /[.,!?;:]$/.test(prev.w.trim());
        const word = clean(w.w);
        const filler = FILLERS.has(word);
        const unclear = !filler && w.p < 0.45 && word.length > 2;
        return (
          <Fragment key={i}>
            {gap >= 0.5 && (
              <span
                className={`mx-1 inline-flex items-center rounded-full px-1.5 align-middle text-[11px] font-bold ${gap >= 2 ? "bg-bad-soft text-bad" : boundary ? "bg-surface-2 text-muted" : "bg-fire-soft text-fire-text"}`}
                title={gap >= 2 ? "Длинная пауза" : boundary ? "Естественная пауза" : "Пауза-колебание посреди фразы"}
              >
                {gap.toFixed(1)}с
              </span>
            )}
            <span
              className={filler ? "rounded bg-fire-soft px-0.5 text-fire-text" : unclear ? "underline decoration-bad decoration-dotted decoration-2 underline-offset-4" : undefined}
              title={filler ? "Слово-паразит" : unclear ? `Прозвучало нечётко (${Math.round(w.p * 100)}%)` : undefined}
            >
              {w.w.trim()}
            </span>{" "}
          </Fragment>
        );
      })}
    </p>
  );
}

export function ListenWord({ word, audio }: { word: string; audio: string }) {
  return (
    <button
      type="button"
      onClick={() => playVoice(audio, word, { rate: 0.9 })}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold transition hover:border-fire hover:text-fire-text"
    >
      <SpeakerHigh size={14} weight="fill" /> {word}
    </button>
  );
}
