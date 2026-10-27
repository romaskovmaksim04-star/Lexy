import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWriting } from "@/lib/content/prompts";
import { WritingRunner } from "./WritingRunner";
import { premiumGate } from "@/components/app/PremiumWall";

export const metadata: Metadata = { title: "Writing" };

export default async function WritingPage({ params }: { params: Promise<{ id: string }> }) {
  const wall = await premiumGate("tests");
  if (wall) return wall;
  const prompt = getWriting((await params).id);
  if (!prompt) notFound();
  // The model answer is shown only after the attempt
  return <WritingRunner prompt={{ ...prompt, model: undefined }} />;
}
