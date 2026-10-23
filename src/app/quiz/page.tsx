import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { EmberSky } from "@/components/landing/EmberSky";
import { Quiz } from "./Quiz";

export const metadata: Metadata = { title: "Персональный план" };

export default async function QuizPage({ searchParams }: { searchParams: Promise<{ ref?: string; plan?: string }> }) {
  const { ref, plan } = await searchParams;
  if (await currentUser()) redirect(plan ? `/pricing/checkout?plan=${encodeURIComponent(plan)}` : "/app");
  return (
    <>
      <EmberSky />
      <Quiz refCode={ref?.slice(0, 40)} plan={plan === "pro" || plan === "proplus" ? plan : undefined} />
    </>
  );
}
