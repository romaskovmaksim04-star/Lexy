import Link from "next/link";
import { ArrowRight, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { currentUser } from "@/lib/auth";
import { signTts } from "@/lib/voice";
import { PERSONA_LIST } from "@/lib/preppy/personas";
import { LEXI_VOICE } from "@/lib/voices";
import { LISTENING } from "@/lib/content/listening";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { FixDemo } from "@/components/landing/FixDemo";
import { Platform } from "@/components/landing/Platform";
import { PreppyShowcase } from "@/components/landing/PreppyShowcase";
import { How } from "@/components/landing/How";
import { MemoryChart } from "@/components/landing/MemoryChart";
import { PlanCards } from "@/components/landing/Pricing";
import { Faq } from "@/components/landing/Faq";
import { Footer } from "@/components/landing/Footer";
import { Reveal } from "@/components/ui/Reveal";
import { FireSpirit } from "@/components/fx/FireSpirit";
import { MistakeTicker } from "@/components/landing/MistakeTicker";
import { GameDeck, GameTiles } from "@/components/games/GameCards";

// Universities that accept IELTS, for the "where it takes you" strip from Maks's landing
const UNIS = [
  "University of Oxford", "Imperial College London", "University of Toronto", "TU Munich", "University of Melbourne",
  "University of Amsterdam", "National University of Singapore", "University of Edinburgh", "KU Leuven",
  "McGill University", "University of Sydney", "ETH Zürich",
];

const FACTS = [
  { title: "Проверка сильнее перечитывания", text: "Когда вспоминаешь ответ сам, мозг понимает, что знание нужно, и закрепляет его." },
  { title: "Повторять лучше с паузами", text: "Три коротких подхода в разные дни дают больше, чем один длинный вечер перед экзаменом." },
  { title: "Сон тоже часть подготовки", text: "Ночью память переносит новое в долгое хранение. Поэтому план не гонит заниматься до ночи." },
];

// Section order follows Maks's landing (hero, universities, games, platform, guarantee, FAQ)
// with the interactive pieces of the app in between: Lexi, the phrase checker, pricing.
export default async function Home() {
  const user = await currentUser();
  const signedIn = !!user;
  const personas = PERSONA_LIST.map((p) => ({
    id: p.id, name: p.name, tagline: p.tagline, sample: p.sample,
    audio: signTts(p.sample, `g:${LEXI_VOICE}`, { style: p.id, mood: p.id === "roast" ? "dramatic" : "warm" }),
  }));
  const line = LISTENING[0].script.find((l) => /oh seven nine three one/.test(l.text)) ?? LISTENING[0].script[0];
  const listening = { audio: signTts(line.text, LISTENING[0].speakers[line.speaker].voice), text: line.text };

  return (
    <>
      <Header signedIn={signedIn} />
      <main>
        <Hero signedIn={signedIn} />

        <section aria-label="Где принимают IELTS" className="pb-6">
          <h2 className="display mx-auto max-w-7xl px-4 text-center text-2xl font-bold md:px-8 md:text-4xl">IELTS открывает двери в лучшие вузы мира</h2>
          <div className="marquee mt-8 overflow-hidden py-2">
            <ul className="marquee-track">
              {[0, 1].flatMap((copy) =>
                UNIS.map((u) => (
                  <li key={`${copy}-${u}`} aria-hidden={copy === 1 || undefined} className="display shrink-0 px-6 text-xl font-bold text-muted/70 md:text-2xl">{u}</li>
                )),
              )}
            </ul>
          </div>
        </section>

        <section id="games" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 md:px-8 md:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <span className="inline-flex rounded-full bg-fire-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-fire-text">● Игры</span>
              <h2 className="display mt-4 text-3xl font-extrabold leading-[1.08] md:text-5xl">Тренируй <span className="text-fire">слабые места</span> в формате игры</h2>
              <p className="mt-5 max-w-[46ch] text-lg text-muted">Три коротких тренажёра: на произношение, связки и ловушки в Listening. Каждый раунд меньше двух минут и с мгновенным разбором.</p>
              <div className="mt-8 flex gap-8">
                <div><p className="display text-3xl font-extrabold">2 мин</p><p className="text-sm text-muted">средний раунд</p></div>
                <div><p className="display text-3xl font-extrabold">3</p><p className="text-sm text-muted">навыка в фокусе</p></div>
                <div><p className="display text-3xl font-extrabold">∞</p><p className="text-sm text-muted">попыток</p></div>
              </div>
            </Reveal>
            <Reveal delay={0.1}><GameDeck /></Reveal>
          </div>
          <div className="mt-12"><GameTiles /></div>
        </section>

        <section id="lexi" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-10 md:px-8 md:py-16">
          <Reveal><PreppyShowcase personas={personas} signedIn={signedIn} /></Reveal>
        </section>

        <Platform listening={listening} />

        <MistakeTicker />

        <section id="try" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 md:px-8 md:py-24">
          <Reveal>
            <h2 className="display max-w-[20ch] text-3xl font-bold leading-[1.1] md:text-5xl">Проверь свою фразу прямо сейчас</h2>
            <p className="mt-5 max-w-[52ch] text-lg text-muted">Типичные ошибки русскоговорящих на IELTS видно сразу, вместе с объяснением, как правильно.</p>
          </Reveal>
          <div className="mt-10"><FixDemo /></div>
        </section>

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

        <How />

        <section id="pricing" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 md:px-8 md:py-28">
          <Reveal>
            <h2 className="display max-w-[18ch] text-3xl font-bold leading-[1.1] md:text-5xl">Начни бесплатно, расти с Pro</h2>
            <p className="mt-5 max-w-[52ch] text-lg text-muted">Весь прогресс сохраняется, когда переходишь между тарифами. Платишь за месяц, без автосписаний.</p>
          </Reveal>
          <div className="mt-12"><PlanCards signedIn={signedIn} /></div>
        </section>

        <section id="guarantee" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-20 md:px-8">
          <Reveal>
            <div className="relative grid items-center gap-8 overflow-hidden rounded-[2.5rem] bg-[#1b1433] p-8 text-white md:grid-cols-[auto_1fr_auto] md:p-12">
              <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, var(--fire), transparent 65%)" }} />
              <div className="relative grid size-28 place-items-center rounded-full border-4 border-fire text-center">
                <span><span className="display block text-3xl font-extrabold">+1.0</span><span className="text-xs font-bold uppercase opacity-80">или возврат</span></span>
              </div>
              <div className="relative">
                <h2 className="display text-3xl font-extrabold md:text-4xl">Гарантия результата</h2>
                <p className="mt-3 max-w-[50ch] opacity-80">В Pro+ подними общий балл на 1.0 на первом экзамене после программы, или вернём деньги за подписку.</p>
              </div>
              <div className="relative grid gap-3">
                <Link href={signedIn ? "/pricing" : "/quiz"} className="btn btn-fire uppercase tracking-wide">Начать подготовку <ArrowRight size={18} weight="bold" /></Link>
                <Link href="/guarantee" className="btn border border-white/25 text-white hover:bg-white/10"><ShieldCheck size={18} weight="fill" /> Условия гарантии</Link>
              </div>
            </div>
          </Reveal>
        </section>

        <Faq />

        <section className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
          <Reveal>
            <div className="relative rounded-[2.5rem] bg-fire-soft px-6 py-16 text-center md:px-16 md:py-24">
              <FireSpirit className="relative mx-auto w-28 md:w-36" talk={false} />
              <h2 className="display relative mx-auto mt-6 max-w-[14ch] text-4xl font-extrabold leading-[1.04] md:text-7xl">Твой план на сегодня уже ждёт</h2>
              <p className="relative mx-auto mt-6 max-w-[42ch] text-lg text-muted">Ответь на 8 вопросов, и GoLexi соберёт занятия под твой балл и дату экзамена.</p>
              <Link href={signedIn ? "/app" : "/quiz"} className="btn btn-fire relative mt-10 px-8 py-5 text-lg uppercase tracking-wide">
                {signedIn ? "Мой план" : "Начать подготовку"} <ArrowRight size={20} weight="bold" />
              </Link>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
