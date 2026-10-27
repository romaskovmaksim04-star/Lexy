import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { LEVEL_WORDS, LEVEL_WORD_BY_ID, WORDS, WORD_TOPICS } from "@/lib/content/words";
import { VOCAB_LEVELS } from "@/lib/content/vocab";
import { signTts } from "@/lib/voice";
import { WordsClient, type StudyCard } from "./WordsClient";
import { premiumGate } from "@/components/app/PremiumWall";

export const metadata: Metadata = { title: "Словарь" };

export default async function WordsPage() {
  const wall = await premiumGate("words");
  if (wall) return wall;
  const user = (await currentUser())!;
  const [cards, own] = await Promise.all([
    db.card.findMany({ where: { userId: user.id }, orderBy: { due: "asc" } }),
    db.userWord.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);
  const now = new Date();
  const ownById = new Map(own.map((w) => [`u:${w.id}`, w]));
  const builtIn = new Map(WORDS.map((w) => [w.id, w]));

  const due: StudyCard[] = cards
    .filter((c) => c.due <= now)
    .slice(0, 60)
    .flatMap((c) => {
      const b = builtIn.get(c.wordId);
      if (b) return [{ id: c.wordId, term: b.en, meaning: b.ru, ipa: b.ipa, example: b.example, audio: signTts(b.en, "examiner"), reps: c.reps, interval: c.interval, ease: c.ease }];
      const v = LEVEL_WORD_BY_ID.get(c.wordId);
      if (v) return [{ id: c.wordId, term: v.en, meaning: v.ru, ipa: "", example: "", audio: signTts(v.en, "examiner"), reps: c.reps, interval: c.interval, ease: c.ease }];
      const u = ownById.get(c.wordId);
      if (u) return [{ id: c.wordId, term: u.term, meaning: u.meaning, ipa: "", example: u.example, audio: signTts(u.term, "examiner"), reps: c.reps, interval: c.interval, ease: c.ease }];
      return [];
    });

  const inQueue = new Set(cards.map((c) => c.wordId));
  const decks = WORD_TOPICS.map((topic) => {
    const words = WORDS.filter((w) => w.topic === topic);
    return { topic, total: words.length, added: words.filter((w) => inQueue.has(w.id)).length, ids: words.map((w) => w.id), sample: words.slice(0, 3).map((w) => w.en) };
  });
  // Level decks hand out the next 20 words they haven't added yet
  const levels = VOCAB_LEVELS.map((lv) => {
    const words = LEVEL_WORDS[lv];
    const fresh = words.filter((w) => !inQueue.has(w.id)).slice(0, 20);
    return { topic: lv, total: words.length, added: words.length - words.filter((w) => !inQueue.has(w.id)).length, ids: fresh.map((w) => w.id), sample: fresh.slice(0, 3).map((w) => w.en) };
  });
  const learned = cards.filter((c) => c.reps >= 2).length;
  const next = cards.find((c) => c.due > now)?.due ?? null;

  return (
    <WordsClient
      due={due}
      decks={decks}
      levels={levels}
      own={own.map((w) => ({ id: w.id, term: w.term, meaning: w.meaning, example: w.example, source: w.source }))}
      stats={{ total: cards.length, learned, due: due.length }}
      nextReview={next ? next.toISOString() : null}
    />
  );
}
