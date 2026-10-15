import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { Quiz } from "./Quiz";

export const metadata: Metadata = { title: "Персональный план" };

export default async function QuizPage() {
  if (await currentUser()) redirect("/app");
  return <Quiz />;
}
