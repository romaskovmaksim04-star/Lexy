import { CalendarCheck, ChartLineUp, ListChecks, Timer } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/ui/Reveal";

const STEPS = [
  { icon: ListChecks, title: "Расскажи о цели", text: "8 коротких вопросов: формат, нужный балл, дата экзамена, сколько времени у тебя есть." },
  { icon: CalendarCheck, title: "Получи план", text: "Каждый день новый набор заданий. Больше всего времени уходит на твою слабую секцию." },
  { icon: Timer, title: "Занимайся от 15 минут", text: "Короткие сессии с таймером. Серия дней держит в ритме, пропуск не сжигает прогресс." },
  { icon: ChartLineUp, title: "Смотри на балл", text: "Каждый ответ даёт оценку по критериям IELTS. Видно, какая секция тянет вниз." },
];

export function How() {
  return (
    <section id="how" className="border-y border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 md:px-8 md:py-28 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-fire-text">Как это работает</p>
            <h2 className="display mt-4 text-3xl font-bold leading-[1.1] md:text-5xl">Первое задание через две минуты</h2>
            <p className="mt-5 max-w-[42ch] text-lg text-muted">Без лекций и вводных курсов. Сразу практика в формате экзамена.</p>
          </Reveal>
        </div>
        <ol className="grid gap-4">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <Reveal delay={i * 0.06}>
                <div className="flex gap-5 rounded-3xl border border-line bg-bg p-6 md:p-8">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-fire-soft text-fire-text">
                    <s.icon size={26} weight="duotone" />
                  </span>
                  <div>
                    <h3 className="display text-lg font-bold md:text-xl">{s.title}</h3>
                    <p className="mt-2 leading-relaxed text-muted">{s.text}</p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
