# GoLexi

Платформа подготовки к IELTS с ИИ-репетитором **Lexi**: с ней можно созвониться и поговорить голосом.
Она поправит ошибки по ходу разговора, а после звонка разберёт его. Ещё в платформе есть тренажёры
всех четырёх секций, проверка Writing и Speaking по критериям IELTS, слова с интервальным
повторением и план на каждый день.

Сайт работает в бете: **[lexy.ghostlynex.fun](https://lexy.ghostlynex.fun)**

## Что внутри

| Раздел | Что делает |
| --- | --- |
| **Lexi** (`/app/lexi`) | Голосовой звонок с репетитором: живое лицо, настроение, правки ошибок прямо в разговоре, разбор после звонка. Характеры от доброго до жёсткого, по желанию с матом |
| **Тесты** (`/app/tests`) | Reading, Listening, Writing, Speaking в формате экзамена, с таймером |
| **Проверка** | Writing и Speaking оценивает ИИ-экзаменатор по четырём критериям IELTS, разметка ошибок в тексте, тайминг речи |
| **Слова** (`/app/words`) | Свой словарь, интервальное повторение |
| **Прогресс** (`/app/progress`) | Баллы по секциям, прогноз итогового балла |
| **Игры** (`/games`) | Короткие игры на слова и грамматику |
| **Тест на план** (`/quiz`) | 8 вопросов, регистрация и персональный план |

## Стек

- **Next.js 15** (App Router, Server Actions), **React 19**, **Tailwind CSS v4**, **Motion**
- **Prisma** + SQLite
- **ai/**: сервис речи на FastAPI. Whisper (faster-whisper) для распознавания и оценки речи, Silero VAD
  отсекает тишину, голоса Silero и облачный TTS
- **LLM** через [polza.ai](https://polza.ai) (OpenAI-совместимый API): диалог Lexi, разбор звонков,
  экзаменатор. Без ключа оценка работает на правилах (`src/lib/analysis.ts`, `grammar.ts`, `speech.ts`)
- Оплата через Platega, уведомления владельцам в Telegram

## Запуск

```bash
npm install
cp .env.example .env      # впиши AUTH_SECRET, остальное по желанию
npx prisma db push        # создаёт базу prisma/dev.db
npm run dev               # http://localhost:3000
```

Сервис речи нужен для звонков с Lexi и для оценки Speaking. Без него сайт тоже работает, тогда
распознаёт и озвучивает речь браузер.

```bash
cd ai
python -m venv venv && . venv/bin/activate
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
LEXY_AI_KEY=... POLZA_API_KEY=... python server.py   # 127.0.0.1:8765
```

`npm test` прогоняет тесты логики: баллы, разбор эссе и речи, интервальное повторение, план,
промпт Lexi и разбор её ответов.

## Структура

```
src/app/                 страницы: лендинг, quiz, кабинет /app, тарифы, оплата, документы
src/app/app/lexi/        звонок с Lexi (LexiCall.tsx)
src/app/api/lexi/        потоковый ответ Lexi: настроение, реплика, аудио
src/components/fx/       лицо Lexi и визуальные эффекты
src/lib/preppy/          промпт Lexi, характеры, разбор тегов, разбор звонка
src/lib/examiner*.ts     ИИ-экзаменатор Writing и Speaking
src/lib/content/         задания Reading, Listening, Writing, Speaking и слова
src/lib/band.ts          перевод ответов в баллы IELTS
src/lib/access.ts        тарифы и лимиты минут
ai/server.py             сервис речи (STT, TTS, VAD)
prisma/schema.prisma     схема базы
```

Статические страницы в корне (`main.html`, `reg.html`, `pricing.html`, `guides.html`, `tools.html` и
другие) это отдельный HTML-прототип на GitHub Pages:
[romaskovmaksim04-star.github.io/Lexy/main.html](https://romaskovmaksim04-star.github.io/Lexy/main.html).

## Переменные окружения

Все переменные описаны в [`.env.example`](.env.example). Ключи хранятся только в `.env` на сервере
и в репозиторий не попадают.
