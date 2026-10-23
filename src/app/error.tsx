"use client";

import Link from "next/link";
import { Mascot } from "@/components/ui/Mascot";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-[70dvh] place-items-center px-4 text-center">
      <div className="grid justify-items-center gap-4">
        <Mascot className="w-20 opacity-80" />
        <h1 className="display text-2xl font-bold">Что-то пошло не так</h1>
        <p className="max-w-[42ch] text-muted">Не удалось загрузить страницу. Попробуй ещё раз или вернись на главную.</p>
        <div className="flex gap-3">
          <button onClick={reset} className="btn btn-fire">Попробовать снова</button>
          <Link href="/" className="btn btn-ghost">На главную</Link>
        </div>
      </div>
    </main>
  );
}
