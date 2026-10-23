import type { Metadata } from "next";
import { MarketingShell } from "@/components/MarketingShell";
import { TRAPS } from "@/lib/games/trap";
import { signTts } from "@/lib/voice";
import { TrapGame } from "./TrapGame";

export const metadata: Metadata = { title: "Listening Trap", description: "Игра для IELTS Listening: диктор меняет ответ посреди фразы. Поймай финальный." };

export default function Page() {
  const items = TRAPS.map((t) => ({
    id: t.id, audio: signTts(t.script, t.voice), script: t.script, question: t.question,
    options: [...t.options], answer: t.options[0], markers: t.markers,
  }));
  return (
    <MarketingShell fire={false}>
      <section className="px-4 pb-24 pt-10 md:px-8 md:pt-16"><TrapGame items={items} /></section>
    </MarketingShell>
  );
}
