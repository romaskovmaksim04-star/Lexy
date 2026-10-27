import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChatsCircle } from "@phosphor-icons/react/dist/ssr";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { remaining } from "@/lib/access";
import { PERSONA_LIST } from "@/lib/preppy/personas";
import { topicFor } from "@/lib/preppy/lexi";
import { LexiRoom } from "./LexiRoom";
import { premiumGate } from "@/components/app/PremiumWall";

export const metadata: Metadata = { title: "Lexi" };

function ago(d: Date) {
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)} мин назад`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} ч назад`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export default async function LexiPage() {
  const wall = await premiumGate("lexi");
  if (wall) return wall;
  const user = (await currentUser())!;
  const [left, recent] = await Promise.all([
    remaining(user, "preppy_seconds"),
    db.conversation.findMany({ where: { userId: user.id, endedAt: { not: null } }, orderBy: { createdAt: "desc" }, take: 4 }),
  ]);
  const personas = PERSONA_LIST.map((p) => ({ id: p.id, name: p.name, tagline: p.tagline, sample: p.sample, voice: p.voice }));
  const prefs = { lang: user.lexiLang === "en" ? ("en" as const) : ("mix" as const), swear: user.lexiSwear };

  return (
    <div className="grid gap-10">
      <LexiRoom personas={personas} initialPersona={user.persona} prefs={prefs} secondsLeft={left} />

      <section>
        <div className="flex items-end justify-between gap-4">
          <h2 className="display text-xl font-bold">Последние разговоры</h2>
        </div>
        {recent.length ? (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {recent.map((c) => {
              const r = c.review ? (JSON.parse(c.review) as { words: number; fixes: unknown[]; llm?: { bands: { overall: number | null } } }) : null;
              return (
                <li key={c.id}>
                  <Link href={`/app/lexi/${c.id}`} className="card flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-fire-soft text-fire-text"><ChatsCircle size={24} weight="duotone" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{topicFor(c.topic, (JSON.parse(c.state) as { topicTitle?: string }).topicTitle).title}</span>
                      <span className="text-sm text-muted">{ago(c.createdAt)}{r?.llm?.bands.overall ? `, ≈ ${r.llm.bands.overall.toFixed(1)}` : ""}{r ? `, ${r.words} слов` : ""}</span>
                    </span>
                    <ArrowRight size={20} className="shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-muted">Пока нет разговоров. Выбери характер и тему выше, и поговорим.</p>
        )}
      </section>
    </div>
  );
}
