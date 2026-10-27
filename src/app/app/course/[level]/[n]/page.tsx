import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { signTts } from "@/lib/voice";
import { isLevel, lessonAt, lessonSteps, levelTest, LESSONS_PER_LEVEL, nextLevel } from "@/lib/course/course";
import { LEVELS } from "@/lib/course/types";
import { premiumGate } from "@/components/app/PremiumWall";
import { LessonRunner, type RunStep } from "./LessonRunner";

export const metadata: Metadata = { title: "Урок" };

// /app/course/B1/7 is lesson 7 of B1, /app/course/B1/test is the level test
export default async function LessonPage({ params }: { params: Promise<{ level: string; n: string }> }) {
  const wall = await premiumGate("course");
  if (wall) return wall;
  const { level, n: raw } = await params;
  if (!isLevel(level)) notFound();
  const user = (await currentUser())!;
  if (LEVELS.indexOf(level) > LEVELS.indexOf(user.courseLevel as never)) redirect("/app/course");
  const n = raw === "test" ? 0 : Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > LESSONS_PER_LEVEL) notFound();

  if (n > 1) {
    // Lessons open one after another
    const prev = await db.lessonResult.findUnique({ where: { userId_level_lesson: { userId: user.id, level, lesson: n - 1 } } });
    if (!prev) redirect(`/app/course?level=${level}`);
  }

  let steps: RunStep[];
  let title: string;
  if (n === 0) {
    const t = levelTest(level);
    title = `Тест уровня ${level}`;
    steps = [
      { kind: "quiz", title: "Грамматика и слова", questions: t.questions },
      { kind: "listening", script: t.listen.script, questions: t.listen.questions, audio: signTts(t.listen.script, "female") },
    ];
  } else {
    title = `Урок ${n} · ${lessonAt(level, n).t}`;
    steps = lessonSteps(level, n).map((s) =>
      s.kind === "listening" ? { ...s, audio: signTts(s.script, "female") }
        : s.kind === "theory" ? { ...s, exampleAudio: s.examples.map((e) => signTts(e, "examiner")) }
          : s);
  }
  const up = nextLevel(level);
  const nextHref = n === 0 ? (up ? `/app/course?level=${up}` : "/app/course") : n < LESSONS_PER_LEVEL ? `/app/course/${level}/${n + 1}` : `/app/course/${level}/test`;
  return <LessonRunner level={level} n={n} title={title} steps={steps} nextHref={nextHref} />;
}
