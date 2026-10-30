import Link from "next/link";
import { Logo } from "@/components/ui/Mascot";
import { MotionToggle } from "@/components/ui/MotionToggle";

export function Footer() {
  return (
    <footer className="border-t border-line bg-bg/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-[38ch] text-sm leading-relaxed text-muted">
            Подготовка к IELTS Academic и General Training. LexiUp не связан с British Council, IDP и Cambridge; задания авторские, в формате экзамена.
          </p>
        </div>
        <div className="grid content-start gap-3 text-sm">
          <p className="font-semibold">Бесплатно</p>
          <Link href="/tools/band" className="text-muted hover:text-ink">Калькулятор балла IELTS</Link>
          <Link href="/guides" className="text-muted hover:text-ink">Гайды по IELTS</Link>
          <Link href="/universities" className="text-muted hover:text-ink">Требования вузов</Link>
          <Link href="/#try" className="text-muted hover:text-ink">Проверка фразы</Link>
          <Link href="/quiz" className="text-muted hover:text-ink">Тест на персональный план</Link>
        </div>
        <div className="grid content-start gap-3 text-sm">
          <p className="font-semibold">LexiUp</p>
          <Link href="/pricing" className="text-muted hover:text-ink">Тарифы</Link>
          <Link href="/guarantee" className="text-muted hover:text-ink">Гарантия результата</Link>
          <Link href="/support" className="text-muted hover:text-ink">Поддержка</Link>
          <Link href="/login" className="text-muted hover:text-ink">Войти</Link>
        </div>
        <div className="grid content-start gap-3 text-sm">
          <p className="font-semibold">Документы</p>
          <Link href="/terms" className="text-muted hover:text-ink">Условия использования</Link>
          <Link href="/privacy" className="text-muted hover:text-ink">Конфиденциальность</Link>
          <Link href="/refund" className="text-muted hover:text-ink">Возврат</Link>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 pb-10 text-xs text-muted md:px-8">
        <span>© {new Date().getFullYear()} LexiUp. IELTS является зарегистрированной торговой маркой её владельцев.</span>
        <MotionToggle />
      </div>
    </footer>
  );
}
