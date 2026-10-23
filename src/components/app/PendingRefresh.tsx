"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mascot } from "@/components/ui/Mascot";

// Waits for work that finishes a few seconds after the page (Lexi's review, the examiner's
// marks) and reloads the page once it is there.
export function PendingRefresh({ check, title, text }: { check: () => Promise<boolean>; title: string; text: string }) {
  const router = useRouter();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    let alive = true;
    let tries = 0;
    const tick = async () => {
      if (!alive) return;
      if (++tries > 40) return setSlow(true);
      const pending = await check().catch(() => false);
      if (!alive) return;
      if (!pending) router.refresh();
      else setTimeout(tick, 2000);
    };
    const t = setTimeout(tick, 1500);
    return () => { alive = false; clearTimeout(t); };
  }, [check, router]);
  return (
    <div className="card flex items-center gap-4 p-6" role="status">
      <Mascot className="w-14 shrink-0 animate-pulse" />
      <div>
        <p className="font-bold">{slow ? "Задерживается" : title}</p>
        <p className="text-sm text-muted">{slow ? "Обнови страницу через минуту. Пока ниже автоматическая оценка." : text}</p>
      </div>
    </div>
  );
}
