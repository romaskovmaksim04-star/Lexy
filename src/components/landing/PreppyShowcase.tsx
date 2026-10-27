"use client";

import { useCalm } from "@/lib/motion-pref";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Microphone, SpeakerHigh } from "@phosphor-icons/react";
import { Mascot } from "@/components/ui/Mascot";
import { playVoice } from "@/components/app/voice-client";
import { checkText } from "@/lib/grammar";
import { persona } from "@/lib/preppy/personas";

type P = { id: string; name: string; tagline: string; sample: string; audio: string };

// One short exchange per character. The mistake is found by the real checker and the
// reply uses the character's real recast line, so the demo shows what the product does.
const DIALOGUE: Record<string, { you: string; follow: string }> = {
  classic: { you: "I am agree that films are better at home.", follow: "Why do you prefer watching at home?" },
  strict: { you: "My brother don't like sport at all.", follow: "Next. What sport do you do?" },
  kind: { you: "She have two cats and they are so funny.", follow: "What are their names?" },
  sarcastic: { you: "I have lived in Kazan since five years.", follow: "Right. And what do you like about Kazan?" },
  roast: { you: "I learn only beautiful words, ugly words I don't learn.", follow: "Is this IELTS or a dating app? Every word gets a chance. Now: what word scares you most?" },
  bro: { you: "My friends and me goes to the gym every day.", follow: "Respect. What's your favourite exercise?" },
  drama: { you: "Yesterday I have watched a very sad film.", follow: "Tell me everything. Did you cry?" },
};

export function PreppyShowcase({ personas, signedIn }: { personas: P[]; signedIn: boolean }) {
  const reduce = useCalm();
  const [id, setId] = useState(personas[0].id);
  const p = personas.find((x) => x.id === id)!;
  const d = DIALOGUE[id];
  const issue = checkText(d.you, "speaking")[0];
  const fixLine = issue ? persona(id).fix[0].replace("{wrong}", issue.original).replace("{right}", issue.fix) : "";
  const reply = `${fixLine} ${d.follow}`.trim();
  const i = issue ? issue.index : -1;

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-ink text-bg">
      <div aria-hidden className="pointer-events-none absolute -left-24 top-1/3 size-96 rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, var(--fire), transparent 65%)" }} />
      <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:p-14">
        <div className="flex flex-col">
          <h2 className="display text-3xl font-bold leading-[1.1] md:text-5xl">Lexi звонит тебе. С характером</h2>
          <p className="mt-5 max-w-[46ch] text-lg opacity-80">Как созвон с другом: просто говоришь, Lexi слушает, смеётся, возмущается и поправляет ошибки прямо в разговоре. Её можно перебить. Выбери характер, от доброй до прожарки.</p>

          <div className="mt-8 grid grid-cols-2 gap-2" role="tablist" aria-label="Характер Lexi">
            {personas.map((x) => (
              <button
                key={x.id}
                role="tab"
                aria-selected={x.id === id}
                onClick={() => setId(x.id)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${x.id === id ? "border-fire bg-white/10" : "border-white/10 hover:border-white/25"}`}
              >
                <span className="block font-bold">{x.name}</span>
                <span className="mt-0.5 block text-xs opacity-70">{x.tagline}</span>
              </button>
            ))}
          </div>

          <div className="mt-auto flex flex-wrap gap-3 pt-8">
            <Link href={signedIn ? "/app/lexi" : "/quiz"} className="btn btn-fire">
              Поговорить с Lexi <ArrowRight size={16} weight="bold" />
            </Link>
            <button type="button" onClick={() => playVoice(p.audio, p.sample)} className="btn border border-white/20 text-bg hover:bg-white/10">
              <SpeakerHigh size={18} weight="fill" /> Послушать голос
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="relative grid size-12 place-items-center rounded-full bg-white/10">
              <motion.span aria-hidden className="absolute inset-0 rounded-full bg-fire/40" animate={reduce ? undefined : { scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2.2, repeat: Infinity }} />
              <Mascot className="relative w-7" />
            </span>
            <div>
              <p className="font-bold">Lexi · {p.name}</p>
              <p className="text-xs opacity-70">в разговоре</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.ol key={id} className="mt-6 grid gap-3" initial="hide" animate="show" exit="hide" variants={{ show: { transition: { staggerChildren: reduce ? 0 : 0.35 } } }}>
              {[
                { who: "preppy", node: p.sample },
                {
                  who: "you",
                  node: i >= 0 ? (
                    <>
                      {d.you.slice(0, i)}
                      <span className="underline decoration-[#1b1433]/70 decoration-wavy decoration-2 underline-offset-4">{issue!.original}</span>{" "}
                      <span className="rounded-md bg-[#1b1433] px-1.5 py-0.5 font-semibold text-[#3dd68c]">{issue!.fix}</span>
                      {d.you.slice(i + issue!.original.length)}
                    </>
                  ) : d.you,
                },
                { who: "preppy", node: reply },
              ].map((m, k) => (
                <motion.li
                  key={k}
                  variants={{ hide: { opacity: 0, y: reduce ? 0 : 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } }}
                  className={`max-w-[88%] rounded-3xl px-4 py-3 text-[15px] leading-relaxed ${m.who === "preppy" ? "bg-white/10" : "ml-auto bg-fire text-[#1b1433]"}`}
                >
                  {m.node}
                </motion.li>
              ))}
            </motion.ol>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-center gap-3 border-t border-white/10 pt-5 text-sm opacity-80">
            <span className="grid size-10 place-items-center rounded-full bg-fire text-[#1b1433]"><Microphone size={18} weight="fill" /></span>
            Зажми пробел или кнопку и говори
          </div>
        </div>
      </div>
    </div>
  );
}
