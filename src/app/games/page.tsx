import type { Metadata } from "next";
import { MarketingShell } from "@/components/MarketingShell";
import { GameDeck, GameTiles } from "@/components/games/GameCards";

export const metadata: Metadata = {
  title: "Игры",
  description: "Короткие игры для подготовки к IELTS: произношение, связки для Writing и ловушки в Listening. Раунд меньше двух минут.",
};

export default function Games() {
  return (
    <MarketingShell fire={false}>
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-10 pt-12 md:px-8 md:pt-20 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-fire-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-fire-text">● Игры</span>
          <h1 className="display mt-4 text-4xl font-extrabold leading-[1.05] md:text-6xl">Тренируй <span className="text-fire">слабые места</span> в формате игры</h1>
          <p className="mt-5 max-w-[48ch] text-lg text-muted">Три коротких тренажёра: на произношение, связки и ловушки в Listening. Каждый раунд меньше двух минут и с мгновенным разбором.</p>
          <div className="mt-8 flex gap-8">
            <div><p className="display text-3xl font-extrabold">2 мин</p><p className="text-sm text-muted">средний раунд</p></div>
            <div><p className="display text-3xl font-extrabold">3</p><p className="text-sm text-muted">навыка в фокусе</p></div>
            <div><p className="display text-3xl font-extrabold">∞</p><p className="text-sm text-muted">попыток</p></div>
          </div>
        </div>
        <GameDeck />
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
        <GameTiles />
      </section>
    </MarketingShell>
  );
}
