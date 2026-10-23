import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getListening } from "@/lib/content/listening";
import { stripAnswers } from "@/lib/content/public";
import { signTts, type Voice } from "@/lib/voice";
import { ListeningRunner } from "./ListeningRunner";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const test = getListening((await params).id);
  return { title: test ? `Listening: ${test.title}` : "Listening" };
}

export default async function ListeningPage({ params }: { params: Promise<{ id: string }> }) {
  const test = getListening((await params).id);
  if (!test) notFound();
  const lines = test.script.map((l) => {
    const voice = test.speakers[l.speaker].voice as Voice;
    return { audio: signTts(l.text, voice), text: l.text, female: voice.startsWith("female") };
  });
  return (
    <ListeningRunner
      id={test.id}
      title={test.title}
      part={test.part}
      context={test.context}
      lines={lines}
      groups={stripAnswers(test.groups)}
    />
  );
}
