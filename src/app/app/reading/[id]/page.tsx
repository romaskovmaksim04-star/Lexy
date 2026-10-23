import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getReading } from "@/lib/content/reading";
import { stripAnswers } from "@/lib/content/public";
import { ReadingRunner } from "./ReadingRunner";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const test = getReading((await params).id);
  return { title: test ? `Reading: ${test.title}` : "Reading" };
}

export default async function ReadingPage({ params }: { params: Promise<{ id: string }> }) {
  const test = getReading((await params).id);
  if (!test) notFound();
  return <ReadingRunner test={{ ...test, groups: stripAnswers(test.groups) }} />;
}
