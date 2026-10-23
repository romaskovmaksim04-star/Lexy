"use client";

import { useMemo } from "react";
import { FireSpirit } from "@/components/fx/FireSpirit";
import type { FaceDriver, FaceMode } from "@/components/fx/LexiFace";
import { MOODS, type Mood } from "@/lib/voices";

function Tile({ mood, mode, talk, female = false }: { mood: Mood; mode: FaceMode; talk: boolean; female?: boolean }) {
  const driver = useMemo<FaceDriver>(() => ({
    mood: () => mood,
    mode: () => mode,
    voice: () => ({ level: talk ? 0.55 : 0, bright: 0.4, playing: talk, analysed: true }),
    hear: () => 0,
    persona: () => "classic",
    female: () => female,
  }), [mood, mode, talk, female]);
  return (
    <div className="grid justify-items-center gap-1 rounded-3xl bg-[#140f24] p-3 text-white">
      <div className="w-[150px]"><FireSpirit face={driver} talk={false} /></div>
      <p className="text-xs">{mood}{talk ? " · talk" : ""}{female ? " · ♀" : ""}{mode !== "speaking" ? ` · ${mode}` : ""}</p>
    </div>
  );
}

export function FaceGrid() {
  return (
    <div className="grid grid-cols-6 gap-3 p-4">
      {(["idle", "hearing", "thinking"] as const).map((m) => <Tile key={m} mood="neutral" mode={m} talk={false} />)}
      {MOODS.map((m) => <Tile key={m} mood={m} mode="speaking" talk={false} />)}
      {(["neutral", "angry", "excited"] as const).map((m) => <Tile key={`${m}t`} mood={m} mode="speaking" talk />)}
      {(["neutral", "warm", "laughing", "strict"] as const).map((m) => <Tile key={`${m}f`} mood={m} mode="speaking" talk={false} female />)}
    </div>
  );
}
