import type { Metadata } from "next";
import { GameTiles } from "@/components/games/GameCards";

export const metadata: Metadata = { title: "Игры" };

// Open to everyone, Premium or not
export default function GamesPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="display text-3xl font-bold md:text-4xl">Игры</h1>
        <p className="mt-1 text-muted">Короткие тренажёры на произношение, связки и ловушки в Listening. Бесплатно и без ограничений.</p>
      </div>
      <GameTiles />
    </div>
  );
}
