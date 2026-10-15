# Lexy

Платформа подготовки к IELTS: лендинг, тест на персональный план, аккаунты, план на каждый день.
Next.js 15 + Tailwind v4 + Motion + Prisma (SQLite локально).

## Запуск

```bash
npm install
cp .env.example .env      # впиши AUTH_SECRET
npx prisma db push        # создаёт базу prisma/dev.db
npm run dev               # http://localhost:3000
```

`npm test` прогоняет тесты логики (баллы, разбор эссе и речи, повторение слов, план).

## Что где

- `src/app/page.tsx` и `src/components/landing/`: лендинг
- `src/app/quiz/`: тест из 8 вопросов и регистрация
- `src/app/app/`: личный кабинет (план на сегодня, профиль)
- `src/lib/content/`: авторские задания Reading, Listening, Writing, Speaking и слова
- `src/lib/analysis.ts`: разбор эссе и речи по критериям IELTS
- `src/lib/band.ts`: перевод ответов в баллы, общий балл
- `legacy/`: первый HTML-черновик

Экраны тренажёров (reading, listening, writing, speaking, слова, прогресс) пока показывают заглушку:
контент и логика оценки уже есть, осталось собрать экраны.
