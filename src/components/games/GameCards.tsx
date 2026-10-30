import Link from "next/link";
import { ArrowRight, Headphones, LinkSimple, Microphone } from "@phosphor-icons/react/dist/ssr";

// The three games from Maks's landing, as cards. Colours follow his design: orange for
// speaking, violet for writing, green for listening.

export const GAMES = [
  {
    href: "/games/shadow", name: "Shadow Speak", skill: "Speaking", sub: "Произношение и ритм", icon: Microphone,
    bg: "linear-gradient(150deg, #ff9a0a, #ff5a1f)",
    text: "Слушаешь фразу и повторяешь вслух. Lexi сравнивает с оригиналом и подсвечивает слова, которые ты «проглотил».",
    tags: ["Speaking", "Pronunciation", "Микрофон"],
  },
  {
    href: "/games/connector", name: "Connector Rush", skill: "Writing", sub: "Связки в Writing", icon: LinkSimple,
    bg: "linear-gradient(150deg, #8b6cf6, #5b3fd6)",
    text: "В предложении пропущена связка: выбери правильную из четырёх за 5 секунд. Ошибся, и сразу видишь правило.",
    tags: ["Writing", "Task 2", "60 сек"],
  },
  {
    href: "/arcade/trap.html", name: "Listening Trap", skill: "Listening", sub: "Ловушки в аудио", icon: Headphones,
    bg: "linear-gradient(150deg, #23c483, #0f8a5f)",
    text: "Диктор меняет ответ посреди фразы: «on Monday… actually, Wednesday». Поймай финальный и больше не попадайся на экзамене.",
    tags: ["Listening", "Anti-trap", "15 сек"],
  },
] as const;

export function GameTiles() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {GAMES.map((g) => (
        <Link key={g.href} href={g.href} className="card group flex flex-col p-6 transition hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl text-white" style={{ background: g.bg }}>
              <g.icon size={24} weight="fill" />
            </span>
            <span>
              <span className="display block text-lg font-bold">{g.name}</span>
              <span className="text-sm text-muted">{g.skill} · {g.sub}</span>
            </span>
          </div>
          <p className="mt-4 flex-1 leading-relaxed text-muted">{g.text}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {g.tags.map((t) => <span key={t} className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-muted">{t}</span>)}
          </div>
          <span className="mt-5 inline-flex items-center gap-1.5 font-bold text-fire-text">
            Играть <ArrowRight size={16} weight="bold" className="transition group-hover:translate-x-1" />
          </span>
        </Link>
      ))}
    </div>
  );
}

/** The fanned deck of game cards from Maks's hero. */
export function GameDeck() {
  return (
    <div aria-hidden className="relative mx-auto h-[340px] w-full max-w-[420px]">
      {GAMES.map((g, i) => {
        const rot = [-10, 0, 10][i];
        const x = [-34, 0, 34][i];
        return (
          <div
            key={g.href}
            className="absolute left-1/2 top-4 flex h-[300px] w-[210px] flex-col justify-between rounded-[2rem] p-5 text-white shadow-2xl transition-transform duration-500 hover:-translate-y-3"
            style={{ background: g.bg, transform: `translateX(calc(-50% + ${x * 2.4}px)) rotate(${rot}deg)`, zIndex: i === 1 ? 3 : 1 }}
          >
            <span className="grid size-14 place-items-center rounded-2xl bg-white/20"><g.icon size={28} weight="fill" /></span>
            <span>
              <span className="display block text-2xl font-extrabold leading-tight">{g.name.split(" ")[0]}<br />{g.name.split(" ")[1]}</span>
              <span className="mt-1 block text-sm opacity-85">{g.sub}</span>
              <span className="mt-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold">● {g.skill}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
