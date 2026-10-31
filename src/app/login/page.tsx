import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { Logo } from "@/components/ui/Mascot";
import { FireSpirit } from "@/components/fx/FireSpirit";
import { safeNext } from "@/lib/safe-next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Вход" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await currentUser()) redirect(next);
  return (
    <main className="grid min-h-[100dvh] lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 md:px-12">
        <Link href="/" aria-label="На главную" className="self-start"><Logo /></Link>
        <div className="mx-auto my-auto w-full max-w-sm py-12">
          <h1 className="display text-3xl font-bold">С возвращением</h1>
          <p className="mt-2 text-muted">Твой план на сегодня уже собран.</p>
          <div className="mt-8"><LoginForm next={next} /></div>
          <p className="mt-6 text-center text-sm text-muted">
            Ещё нет аккаунта? <Link href="/quiz" className="font-semibold text-ink underline underline-offset-4">Начать подготовку</Link>
          </p>
          <p className="mt-3 text-center text-sm text-muted">
            Забыли пароль? <Link href="/support" className="font-semibold text-ink underline underline-offset-4">Напиши в поддержку</Link>
          </p>
        </div>
      </div>
      <div className="relative hidden overflow-hidden lg:block" style={{ background: "linear-gradient(150deg, #ffb340 0%, #ff6a2b 55%, #f04a12 100%)" }}>
        <div className="absolute left-1/2 top-[42%] w-64 -translate-x-1/2 -translate-y-1/2"><FireSpirit className="w-64" talk={false} /></div>
        <p className="display absolute bottom-12 left-12 right-12 text-3xl font-bold leading-tight text-[#1b1433]">Пятнадцать минут в день лучше, чем пять часов в воскресенье.</p>
      </div>
    </main>
  );
}
