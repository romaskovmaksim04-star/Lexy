import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { currentUser } from "@/lib/auth";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Platform } from "@/components/landing/Platform";
import { How } from "@/components/landing/How";
import { MemoryChart } from "@/components/landing/MemoryChart";
import { Faq } from "@/components/landing/Faq";
import { Footer } from "@/components/landing/Footer";
import { BandCalculator } from "@/components/BandCalculator";
import { Reveal } from "@/components/ui/Reveal";
import { Mascot } from "@/components/ui/Mascot";

const FACTS = [
  { title: "Проверка сильнее перечитывания", text: "Когда вспоминаешь ответ сам, мозг понимает, что знание нужно, и закрепляет его." },
  { title: "Повторять лучше с паузами", text: "Три коротких подхода в разные дни дают больше, чем один длинный вечер перед экзаменом." },
  { title: "Сон тоже часть подготовки", text: "Ночью память переносит новое в долгое хранение. Поэтому план не гонит заниматься до ночи." },
];

export default async function Home() {
  const user = await currentUser();
  return (
    <>
      <Header signedIn={!!user} />
      <main>
        <Hero />
        <Platform />
        <How />

        <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 md:px-8 md:py-28 lg:grid-cols-2">
          <Reveal>
            <h2 className="display text-3xl font-bold leading-[1.1] md:text-5xl">Забывать нормально. Важно, когда повторить</h2>
            <div className="mt-10 grid gap-8">
              {FACTS.map((f) => (
                <div key={f.title} className="border-l-2 border-fire pl-5">
                  <h3 className="text-lg font-bold">{f.title}</h3>
                  <p className="mt-1.5 max-w-[48ch] leading-relaxed text-muted">{f.text}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="card p-5 md:p-8">
              <MemoryChart />
            </div>
          </Reveal>
        </section>

        <section className="bg-surface-2">
          <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
            <Reveal>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-fire-text">Бесплатный инструмент</p>
              <h2 className="display mt-4 max-w-[20ch] text-3xl font-bold leading-[1.1] md:text-5xl">Сколько у тебя выйдет в итоге</h2>
            </Reveal>
            <div className="mt-12"><BandCalculator /></div>
          </div>
        </section>

        <Faq />

        <section className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-14 text-bg md:px-16 md:py-20">
              <Mascot animated className="bob absolute -bottom-6 right-6 hidden w-40 opacity-95 md:block lg:right-20 lg:w-52" />
              <h2 className="display max-w-[16ch] text-3xl font-bold leading-[1.1] md:text-5xl">Твой план на сегодня уже ждёт</h2>
              <p className="mt-5 max-w-[40ch] text-lg opacity-80">Ответь на 8 вопросов, и Lexy соберёт занятия под твой балл и дату экзамена.</p>
              <Link href={user ? "/app" : "/quiz"} className="btn btn-fire mt-9 px-7 py-4 text-base">
                {user ? "Мой план" : "Начать подготовку"} <ArrowRight size={18} weight="bold" />
              </Link>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
