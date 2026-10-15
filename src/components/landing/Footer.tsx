import Link from "next/link";
import { Logo } from "@/components/ui/Mascot";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-[38ch] text-sm leading-relaxed text-muted">
            Подготовка к IELTS Academic и General Training. Lexy не связан с British Council, IDP и Cambridge; задания авторские, в формате экзамена.
          </p>
        </div>
        <div className="grid content-start gap-3 text-sm">
          <p className="font-semibold">Бесплатно</p>
          <Link href="/tools/band" className="text-muted hover:text-ink">Калькулятор балла IELTS</Link>
          <Link href="/quiz" className="text-muted hover:text-ink">Тест на персональный план</Link>
        </div>
        <div className="grid content-start gap-3 text-sm">
          <p className="font-semibold">Аккаунт</p>
          <Link href="/login" className="text-muted hover:text-ink">Войти</Link>
          <Link href="/#faq" className="text-muted hover:text-ink">Вопросы</Link>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-10 text-xs text-muted md:px-8">© {new Date().getFullYear()} Lexy. IELTS является зарегистрированной торговой маркой её владельцев.</div>
    </footer>
  );
}
