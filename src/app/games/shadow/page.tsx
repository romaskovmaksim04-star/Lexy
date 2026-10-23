import type { Metadata } from "next";
import { MarketingShell } from "@/components/MarketingShell";
import { currentUser } from "@/lib/auth";
import { SHADOW_PHRASES } from "@/lib/games/shadow";
import { signTts } from "@/lib/voice";
import { ShadowSpeak } from "./ShadowSpeak";

export const metadata: Metadata = { title: "Shadow Speak", description: "Игра на произношение: повторяй фразы за носителем, Lexi подсвечивает проглоченные слова." };
export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await currentUser();
  // A fresh set each visit: two short, three medium, three long phrases
  const n = SHADOW_PHRASES.length;
  const pick = (from: number, to: number, k: number) =>
    SHADOW_PHRASES.slice(Math.floor(n * from), Math.floor(n * to)).sort(() => Math.random() - 0.5).slice(0, k);
  const phrases = [...pick(0, 0.33, 2), ...pick(0.33, 0.66, 3), ...pick(0.66, 1, 3)].map((text) => ({
    text, audio: signTts(text, "female"), slow: signTts(text, "female", "slow"),
  }));
  return (
    <MarketingShell fire={false}>
      <section className="px-4 pb-24 pt-10 md:px-8 md:pt-16"><ShadowSpeak phrases={phrases} signedIn={!!user} /></section>
    </MarketingShell>
  );
}
