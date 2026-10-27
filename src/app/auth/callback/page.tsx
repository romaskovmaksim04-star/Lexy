import type { Metadata } from "next";
import { Callback } from "./Callback";

export const metadata: Metadata = { title: "Вход", robots: { index: false } };

export default function CallbackPage() {
  return <main className="grid min-h-[100dvh] place-items-center px-4"><Callback /></main>;
}
