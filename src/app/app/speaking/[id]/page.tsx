import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSpeaking } from "@/lib/content/prompts";
import { signTts } from "@/lib/voice";
import { SpeakingRunner } from "./SpeakingRunner";

export const metadata: Metadata = { title: "Speaking" };

const INTRO: Record<1 | 2 | 3, string> = {
  1: "Good morning. In this part, I'd like to ask you some questions about yourself.",
  2: "Now I'm going to give you a topic, and I'd like you to talk about it for one to two minutes. You have one minute to prepare. You can make some notes if you wish.",
  3: "We've been talking about this topic. Now I'd like to discuss with you some more general questions related to it.",
};

export default async function SpeakingPage({ params }: { params: Promise<{ id: string }> }) {
  const task = getSpeaking((await params).id);
  if (!task) notFound();
  const questions = task.questions.map((q, i) => {
    // For the cue card the examiner reads only the first line; the bullets stay on screen
    const spoken = task.part === 2 ? q.split("\n")[0] : q;
    const say = i === 0 ? `${INTRO[task.part]} ${spoken}` : spoken;
    return { text: q, spoken: say, audio: signTts(say, "examiner"), slow: signTts(say, "examiner", "slow") };
  });
  return (
    <SpeakingRunner
      id={task.id}
      part={task.part}
      topic={task.topic}
      prepSeconds={task.prepSeconds}
      answerSeconds={task.answerSeconds}
      questions={questions}
    />
  );
}
