import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { BandCalculator } from "@/components/BandCalculator";

export const metadata: Metadata = {
  title: "Калькулятор балла IELTS",
  description: "Посчитай общий балл IELTS по четырём секциям или переведи число верных ответов в Listening и Reading в балл.",
};

export default async function BandToolPage() {
  const user = await currentUser();
  return (
    <>
      <Header signedIn={!!user} />
      <main className="mx-auto max-w-5xl px-4 py-14 md:px-8 md:py-20">
        <h1 className="display text-3xl font-bold leading-[1.1] md:text-5xl">Калькулятор балла IELTS</h1>
        <p className="mt-4 max-w-[56ch] text-lg text-muted">Overall band по четырём секциям, или перевод верных ответов в Listening и Reading в балл.</p>
        <div className="card mt-10 p-6 md:p-10"><BandCalculator /></div>
        <div className="mt-14 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold">Как считается общий балл</h2>
            <p className="mt-3 leading-relaxed text-muted">Баллы четырёх секций складываются и делятся на четыре. Если получилось x.25, балл округляют до x.5; если x.75, до следующего целого. Например, 6.5, 6.5, 5.0 и 7.0 дают 6.25, то есть 6.5.</p>
          </div>
          <div>
            <h2 className="text-xl font-bold">Listening и Reading</h2>
            <p className="mt-3 leading-relaxed text-muted">В каждой секции 40 вопросов. Для 7.0 в Listening нужно около 30 верных ответов, в Academic Reading тоже 30, а в General Training Reading 34. Точные границы могут сдвигаться на один ответ от теста к тесту.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
