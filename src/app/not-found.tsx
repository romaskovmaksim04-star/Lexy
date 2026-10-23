import Link from "next/link";
import { Mascot } from "@/components/ui/Mascot";

export default function NotFound() {
  return (
    <main className="grid min-h-[100dvh] place-items-center px-4 text-center">
      <div className="grid justify-items-center gap-4">
        <Mascot className="w-24 opacity-80" />
        <p className="display text-6xl font-extrabold text-fire-text">404</p>
        <h1 className="display text-2xl font-bold">Потеряли нить</h1>
        <p className="max-w-[40ch] text-muted">Такой страницы нет: неверный адрес, ссылка переехала или просто опечатка.</p>
        <Link href="/" className="btn btn-fire mt-2">На главную</Link>
      </div>
    </main>
  );
}
