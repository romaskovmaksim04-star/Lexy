"use client";

import { useTransition } from "react";
import { setCourseLevel } from "@/app/actions";
import { LEVELS } from "@/lib/course/types";

// Starting level by the student's own choice; a higher level opens everything below it
export function LevelPicker({ current }: { current: string }) {
  const [pending, start] = useTransition();
  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-muted">
      Мой уровень
      <select defaultValue={current} disabled={pending} onChange={(e) => start(() => setCourseLevel(e.target.value))} className="field w-auto py-2">
        {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
      </select>
    </label>
  );
}
