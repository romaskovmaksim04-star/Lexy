import type { Metadata } from "next";
import { ArcadeFrame } from "@/components/games/ArcadeFrame";

export const metadata: Metadata = { title: "Shadow Speak", description: "Игра на произношение: повторяй фразы вслух, LexiUp подсвечивает проглоченные слова." };
export const dynamic = "force-static";

export default function Page() {
  return <ArcadeFrame src="/arcade/shadow.html" title="Shadow Speak" />;
}
