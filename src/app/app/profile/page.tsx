import type { Metadata } from "next";
import Link from "next/link";
import { Crown, SignOut } from "@phosphor-icons/react/dist/ssr";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isPremium, openBeta } from "@/lib/access";
import { logout } from "@/app/actions";
import { ProfileForm, DeleteAccount, CopyLink } from "./ProfileForms";
import { MotionToggle } from "@/components/ui/MotionToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export const metadata: Metadata = { title: "Профиль" };

export default async function Profile() {
  const user = (await currentUser())!;
  const [invited, attempts] = await Promise.all([
    db.user.count({ where: { referredBy: user.id } }),
    db.attempt.count({ where: { userId: user.id } }),
  ]);
  const premium = isPremium(user);
  const site = process.env.SITE_URL ?? "";
  const ref = `${site}/quiz?ref=${user.referralCode}`;

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="display text-3xl font-bold md:text-4xl">Профиль</h1>
        <p className="mt-2 text-muted">{user.email} · аккаунт создан {user.createdAt.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      <section className={`relative overflow-hidden rounded-[2rem] p-6 md:p-8 ${premium ? "bg-ink text-bg" : "card"}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 font-bold"><Crown size={22} weight="fill" className="text-fire" /> {premium ? "Premium" : "Бесплатный план"}</p>
            <p className={`mt-1 text-sm ${premium ? "opacity-80" : "text-muted"}`}>
              {openBeta() ? "Сейчас открытое тестирование: всё доступно бесплатно." : premium && user.premiumUntil ? `Активна до ${user.premiumUntil.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}` : "Безлимитные тесты, проверки Writing и Speaking и разговоры с Lexi в Premium."}
            </p>
          </div>
          {!premium && <Link href="/pricing" className="btn btn-fire">Получить Premium</Link>}
        </div>
      </section>

      <section className="card p-6 md:p-8">
        <h2 className="display text-xl font-bold">Настройки подготовки</h2>
        <ProfileForm
          user={{
            name: user.name,
            format: user.format,
            targetBand: user.targetBand,
            focusSkill: user.focusSkill,
            dailyMinutes: user.dailyMinutes,
            examDate: user.examDate ? user.examDate.toISOString().slice(0, 10) : "",
            emailOptIn: user.emailOptIn,
          }}
        />
      </section>

      <section className="card p-6 md:p-8">
        <h2 className="display text-xl font-bold">Пригласи друзей</h2>
        <p className="mt-2 max-w-[56ch] text-muted">Друг получает скидку 15% на первый месяц. Ты получаешь месяц Premium за каждого друга, который оформит подписку.</p>
        <div className="mt-4"><CopyLink link={ref} /></div>
        <p className="mt-3 text-sm text-muted">Приглашено друзей: {invited}</p>
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="font-bold">Оформление</h2>
          <p className="mt-1 text-sm text-muted">Тема и анимации запоминаются в этом браузере.</p>
        </div>
        <div className="flex items-center gap-2"><ThemeToggle /><MotionToggle /></div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <form action={logout}><button className="btn btn-ghost"><SignOut size={18} /> Выйти</button></form>
        <p className="text-sm text-muted">Пройдено тестов: {attempts}</p>
      </div>

      <DeleteAccount />
    </div>
  );
}
