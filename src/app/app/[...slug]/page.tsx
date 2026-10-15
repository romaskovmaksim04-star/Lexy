import Link from "next/link";
import { Mascot } from "@/components/ui/Mascot";

// Trainers (reading, listening, writing, speaking, words, progress) land here until their pages are built.
export default function Soon() {
  return (
    <div className="grid place-items-center py-20 text-center">
      <Mascot animated className="bob w-28" />
      <h1 className="display mt-6 text-2xl font-bold">Этот раздел скоро будет</h1>
      <p className="mt-2 max-w-[40ch] text-muted">Контент и разбор ответов уже готовы, осталось собрать экран.</p>
      <Link href="/app" className="btn btn-fire mt-8">К плану</Link>
    </div>
  );
}
