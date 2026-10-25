/* golexi-i18n.js — перевод интерфейса портированных экранов GoLexi под язык нашего сайта.
   Работает поверх их разметки (текст не меняем в исходниках): заменяет подписи/кнопки
   на RU/EN/KZ/UZ. Контент заданий (IELTS) остаётся как есть. */
(function (w, d) {
  "use strict";
  var lang = "ru";
  try { lang = (d.documentElement.getAttribute("lang") || (w.localStorage && localStorage.getItem("lang")) || "ru").slice(0, 2).toLowerCase(); } catch (e) { lang = "ru"; }
  if (lang === "ru" || !lang) return;
  if (lang !== "en" && lang !== "kz" && lang !== "uz") lang = "en";

  var T = {
    "Пробные тесты IELTS": { en: "IELTS mock tests", kz: "IELTS сынақ тесттері", uz: "IELTS sinov testlari" },
    "Выбери секцию. Сначала идут задания, которые ты ещё не проходил(а).": { en: "Pick a section. First come the tasks you haven't tried yet.", kz: "Бөлімді таңда. Алдымен өтпеген тапсырмаларың келеді.", uz: "Bo‘limni tanlang. Avval o‘tmagan topshiriqlaringiz keladi." },
    "Случайный тест": { en: "Random test", kz: "Кездейсоқ тест", uz: "Tasodifiy test" },
    "Здесь пока нет тестов для твоего формата.": { en: "No tests for your format yet.", kz: "Сенің форматыңа тест әзірге жоқ.", uz: "Sizning formatingiz uchun hozircha test yo‘q." },
    "Listening": { en: "Listening", kz: "Listening", uz: "Listening" },
    "Reading": { en: "Reading", kz: "Reading", uz: "Reading" },
    "Writing": { en: "Writing", kz: "Writing", uz: "Writing" },
    "Speaking": { en: "Speaking", kz: "Speaking", uz: "Speaking" },
    "Завершить": { en: "Finish", kz: "Аяқтау", uz: "Tugatish" },
    "Отвечено": { en: "Answered", kz: "Жауап", uz: "Javob" },
    "из": { en: "of", kz: "/", uz: "/" },
    "мин": { en: "min", kz: "мин", uz: "daq" },
    "минут": { en: "min", kz: "мин", uz: "daq" },
    "слов": { en: "words", kz: "сөз", uz: "so‘z" },
    "слов, минимум есть": { en: "words, minimum reached", kz: "сөз, минимум жетті", uz: "so‘z, minimumga yetdi" },
    "Проверяем…": { en: "Checking…", kz: "Тексерудеміз…", uz: "Tekshirilmoqda…" },
    "Проверить ответы": { en: "Check answers", kz: "Жауаптарды тексеру", uz: "Javoblarni tekshirish" },
    "Всё равно отправить": { en: "Submit anyway", kz: "Бәрібір жіберу", uz: "Baribir yuborish" },
    "Продолжить": { en: "Continue", kz: "Жалғастыру", uz: "Davom etish" },
    "Есть неотвеченные вопросы": { en: "Some questions are unanswered", kz: "Жауапсыз сұрақтар бар", uz: "Javobsiz savollar bor" },
    "Выделить": { en: "Highlight", kz: "Бөлектеу", uz: "Ajratish" },
    "В карточки": { en: "To cards", kz: "Карточкаға", uz: "Kartochkaga" },
    "Текст": { en: "Text", kz: "Мәтін", uz: "Matn" },
    "Перед началом": { en: "Before you start", kz: "Бастамас бұрын", uz: "Boshlashdan oldin" },
    "Как на экзамене": { en: "Exam mode", kz: "Емтихан сияқты", uz: "Imtihondagidek" },
    "Тренировка": { en: "Practice mode", kz: "Жаттығу", uz: "Mashq" },
    "С начала": { en: "From the start", kz: "Басынан", uz: "Boshidan" },
    "Пауза": { en: "Pause", kz: "Кідірту", uz: "Pauza" },
    "Слушать": { en: "Listen", kz: "Тыңдау", uz: "Tinglash" },
    "Твой ответ": { en: "Your answer", kz: "Сенің жауабың", uz: "Sizning javobingiz" },
    "Напиши здесь…": { en: "Start writing here…", kz: "Осында жаз…", uz: "Shu yerga yozing…" },
    "Начни писать здесь…": { en: "Start writing here…", kz: "Осында жаза баста…", uz: "Shu yerga yozishni boshlang…" },
    "Отправить на проверку": { en: "Submit for review", kz: "Тексеруге жіберу", uz: "Tekshiruvga yuborish" },
    "Отправить": { en: "Submit", kz: "Жіберу", uz: "Yuborish" },
    "Дописать": { en: "Keep writing", kz: "Жалғастыру", uz: "Yozishda davom etish" },
    "Проверяем эссе": { en: "Reviewing your essay", kz: "Эссеңді тексерудеміз", uz: "Inshongiz tekshirilmoqda" },
    "Начать Part 1": { en: "Start Part 1", kz: "Part 1 бастау", uz: "Part 1 ni boshlash" },
    "Начать Part 2": { en: "Start Part 2", kz: "Part 2 бастау", uz: "Part 2 ni boshlash" },
    "Начать Part 3": { en: "Start Part 3", kz: "Part 3 бастау", uz: "Part 3 ni boshlash" },
    "Ещё раз": { en: "Play again", kz: "Қайта тыңдау", uz: "Yana eshitish" },
    "Показать текст": { en: "Show text", kz: "Мәтінді көрсету", uz: "Matnni ko‘rsatish" },
    "Скрыть текст": { en: "Hide text", kz: "Мәтінді жасыру", uz: "Matnni yashirish" },
    "Экзаменатор задаёт вопрос…": { en: "The examiner is asking…", kz: "Емтихан алушы сұрақ қоюда…", uz: "Imtihon oluvchi savol bermoqda…" },
    "Готово": { en: "Done", kz: "Дайын", uz: "Tayyor" },
    "Дальше": { en: "Next", kz: "Әрі қарай", uz: "Keyingi" },
    "Далее": { en: "Next", kz: "Әрі қарай", uz: "Keyingi" },
    "Закончить": { en: "Finish", kz: "Аяқтау", uz: "Tugatish" },
    "Стоп": { en: "Stop", kz: "Тоқтату", uz: "To‘xtatish" },
    "Ошибки": { en: "Mistakes", kz: "Қателер", uz: "Xatolar" },
    "Оценка по критериям": { en: "Band by criteria", kz: "Критерийлер бойынша баға", uz: "Mezonlar bo‘yicha ball" },
    "Как усилить": { en: "How to improve", kz: "Қалай күшейтуге болады", uz: "Qanday yaxshilash mumkin" },
    "Что делать дальше": { en: "What to do next", kz: "Әрі қарай не істеу керек", uz: "Keyin nima qilish kerak" },
    "Было": { en: "Before", kz: "Бұрын", uz: "Avval" },
    "Лучше (Band 7.5+)": { en: "Better (Band 7.5+)", kz: "Жақсырақ (Band 7.5+)", uz: "Yaxshiroq (Band 7.5+)" },
    "из 9.0": { en: "of 9.0", kz: "9.0-ден", uz: "9.0 dan" },
    "Замечаний нет.": { en: "No comments.", kz: "Ескерту жоқ.", uz: "Izohlar yo‘q." },
    "Твой ответ:": { en: "Your answer:", kz: "Сенің жауабың:", uz: "Sizning javobingiz:" },
    "Правильный ответ:": { en: "Correct answer:", kz: "Дұрыс жауап:", uz: "To‘g‘ri javob:" },
    "(нет ответа)": { en: "(no answer)", kz: "(жауап жоқ)", uz: "(javob yo‘q)" },
    "Здесь нет ошибок!": { en: "No mistakes here!", kz: "Мұнда қате жоқ!", uz: "Bu yerda xato yo‘q!" },
    "Здесь пока пусто.": { en: "Nothing here yet.", kz: "Әзірге бос.", uz: "Hozircha bo‘sh." },
    "Назад": { en: "Back", kz: "Артқа", uz: "Orqaga" },
    "В кабинет": { en: "Back to dashboard", kz: "Кабинетке", uz: "Kabinetga" },
    "Пройти ещё раз": { en: "Try again", kz: "Қайта тапсыру", uz: "Yana urinish" },
    "Результат не найден.": { en: "Result not found.", kz: "Нәтиже табылмады.", uz: "Natija topilmadi." },
    "К заданиям": { en: "To tasks", kz: "Тапсырмаларға", uz: "Topshiriqlarga" },
    "Выйти": { en: "Exit", kz: "Шығу", uz: "Chiqish" },
    "Начать Part": { en: "Start Part", kz: "Бастау: Part", uz: "Boshlash: Part" },
    "Интервью: короткие вопросы о тебе. Отвечай по 2-4 предложения.": { en: "Interview: short questions about you. Answer in 2-4 sentences.", kz: "Сұхбат: өзің туралы қысқа сұрақтар. 2-4 сөйлеммен жауап бер.", uz: "Intervyu: o‘zingiz haqida qisqa savollar. 2-4 gap bilan javob bering." },
    "Карточка: минута на подготовку и до двух минут монолога.": { en: "Cue card: one minute to prepare, up to two minutes to speak.", kz: "Карточка: бір минут дайындық және екі минутқа дейін сөйлеу.", uz: "Karta: bir daqiqa tayyorgarlik va ikki daqiqagacha gapirish." },
    "Дискуссия: развёрнутые ответы с аргументами и примерами.": { en: "Discussion: extended answers with reasons and examples.", kz: "Пікірталас: дәлелдер мен мысалдармен кеңейтілген жауаптар.", uz: "Muhokama: dalillar va misollar bilan kengaytirilgan javoblar." },
    "Экзаменатор зачитает каждый вопрос вслух. Запись начнётся сама, нажми «Далее», когда закончишь ответ.": { en: "The examiner reads each question aloud. Recording starts automatically; press Next when you finish.", kz: "Емтихан алушы әр сұрақты дауыстап оқиды. Жазба өзі басталады, аяқтағанда «Әрі қарай» бас.", uz: "Imtihon oluvchi har bir savolni ovoz chiqarib o‘qiydi. Yozuv o‘zi boshlanadi, tugatgach «Keyingi» bosing." },
    "Медленный темп речи экзаменатора": { en: "Slower examiner speech", kz: "Емтихан алушының баяу сөйлеуі", uz: "Imtihon oluvchining sekin nutqi" },
    "Браузер спросит доступ к микрофону, разреши его.": { en: "Your browser will ask for microphone access — allow it.", kz: "Браузер микрофонға рұқсат сұрайды — рұқсат бер.", uz: "Brauzer mikrofonga ruxsat so‘raydi — ruxsat bering." },
    "Транскрибируем речь и оцениваем": { en: "Transcribing and scoring your speech", kz: "Сөйлеуді транскрипциялап, бағалаймыз", uz: "Nutqni transkripsiya qilib, baholaymiz" },
    "Не получилось записать ответ": { en: "Couldn't record your answer", kz: "Жауапты жазу мүмкін болмады", uz: "Javobni yozib olib bo‘lmadi" },
    "Попробовать снова": { en: "Try again", kz: "Қайта көру", uz: "Qayta urinish" },
    "К тестам": { en: "To tests", kz: "Тесттерге", uz: "Testlarga" },
    "Заметки": { en: "Notes", kz: "Жазбалар", uz: "Eslatmalar" },
    "Ключевые слова для каждого пункта": { en: "Key words for each point", kz: "Әр тармаққа кілт сөздер", uz: "Har bir band uchun kalit so‘zlar" },
    "Я готов(а), начать ответ": { en: "I'm ready, start answering", kz: "Дайынмын, жауапты бастау", uz: "Tayyorman, javobni boshlash" },
    "Повторить вопрос": { en: "Repeat the question", kz: "Сұрақты қайталау", uz: "Savolni takrorlash" },
    "Включаем микрофон…": { en: "Turning on the microphone…", kz: "Микрофонды қосамыз…", uz: "Mikrofon yoqilmoqda…" },
    "Проверки на сегодня закончились": { en: "No checks left today", kz: "Бүгінгі тексерулер бітті", uz: "Bugungi tekshiruvlar tugadi" },
    "Бесплатно доступны 3 проверки Speaking в день. С Premium до 80.": { en: "Free plan: 3 Speaking checks a day. With Premium up to 80.", kz: "Тегін: күніне 3 Speaking тексеруі. Premium-мен 80-ге дейін.", uz: "Bepul: kuniga 3 Speaking tekshiruvi. Premium bilan 80 gacha." },
    "На экзамене за это снижают балл. Отправить всё равно?": { en: "On the exam this lowers your band. Submit anyway?", kz: "Емтиханда бұл үшін балл төмендейді. Бәрібір жіберу керек пе?", uz: "Imtihonda bu ballni pasaytiradi. Baribir yuborilsinmi?" },
    "Задание": { en: "Task", kz: "Тапсырма", uz: "Topshiriq" },
    "Надень наушники и найди тихое место. Отвечай прямо во время прослушивания, как на экзамене.": { en: "Put on headphones and find a quiet place. Answer while listening, as in the exam.", kz: "Құлаққап киіп, тыныш орын тап. Емтихандағыдай тыңдау кезінде жауап бер.", uz: "Quloqchin taqing va tinch joy toping. Imtihondagidek tinglash paytida javob bering." },
    "30 секунд на вопросы, потом запись один раз, без паузы.": { en: "30 seconds to read the questions, then the recording plays once, no pause.", kz: "Сұрақтарға 30 секунд, содан кейін жазба бір рет, кідіріссіз.", uz: "Savollarga 30 soniya, keyin yozuv bir marta, pauzasiz." },
    "Пауза и повтор с начала, когда нужно.": { en: "Pause and replay from the start when needed.", kz: "Керек кезде кідіртіп, басынан қайтала.", uz: "Kerak bo‘lganda pauza qilib, boshidan qayta eshiting." },
    "Озвучка сейчас недоступна. Обнови страницу через минуту.": { en: "Audio is unavailable right now. Refresh in a minute.", kz: "Дыбыс әзірге қолжетімсіз. Бір минуттан кейін бетті жаңарт.", uz: "Ovoz hozircha mavjud emas. Bir daqiqadan keyin sahifani yangilang." },
    "Выдели слово или фразу, чтобы подсветить или сохранить в карточки.": { en: "Select a word or phrase to highlight or save to cards.", kz: "Бөлектеу немесе карточкаға сақтау үшін сөзді не сөз тіркесін таңда.", uz: "Ajratish yoki kartochkaga saqlash uchun so‘z yoki iborani belgilang." }
  };

  function pick(k) { var e = T[k]; return e ? (e[lang] || e.en) : null; }

  var RX = [
    [/^Отвечено (\d+) из (\d+)$/, { en: "Answered $1 of $2", kz: "Жауап: $1 / $2", uz: "Javob: $1 / $2" }],
    [/^Вопросы (\d+)\/(\d+)$/, { en: "Questions $1/$2", kz: "Сұрақтар $1/$2", uz: "Savollar $1/$2" }],
    [/^Вопросы (\d+) \/ (\d+)$/, { en: "Questions $1 / $2", kz: "Сұрақтар $1 / $2", uz: "Savollar $1 / $2" }],
    [/^вопрос (\d+) из (\d+)$/, { en: "question $1 of $2", kz: "$1 / $2 сұрақ", uz: "$1 / $2 savol" }],
    [/^Part (\d) · вопрос (\d+) из (\d+)$/, { en: "Part $1 · question $2 of $3", kz: "Part $1 · $2 / $3 сұрақ", uz: "Part $1 · $2 / $3 savol" }],
    [/^Неправильные \((\d+)\)$/, { en: "Wrong ($1)", kz: "Қателер ($1)", uz: "Xatolar ($1)" }],
    [/^Правильные \((\d+)\)$/, { en: "Correct ($1)", kz: "Дұрыстар ($1)", uz: "To‘g‘rilar ($1)" }],
    [/^Все \((\d+)\)$/, { en: "All ($1)", kz: "Барлығы ($1)", uz: "Hammasi ($1)" }],
    [/^(\d+) из (\d+) слов$/, { en: "$1 of $2 words", kz: "$1 / $2 сөз", uz: "$1 / $2 so‘z" }],
    [/^(\d+) слов, минимум есть$/, { en: "$1 words, minimum reached", kz: "$1 сөз, минимум жетті", uz: "$1 so‘z, minimumga yetdi" }],
    [/^Задание · (\d+) минут · минимум (\d+) слов$/, { en: "Task · $1 min · at least $2 words", kz: "Тапсырма · $1 мин · кемінде $2 сөз", uz: "Topshiriq · $1 daq · kamida $2 so‘z" }],
    [/^Меньше (\d+) слов$/, { en: "Fewer than $1 words", kz: "$1 сөзден аз", uz: "$1 so‘zdan kam" }],
    [/^Посмотри вопросы\. Запись начнётся через (\d+) с$/, { en: "Read the questions. Recording starts in $1 s", kz: "Сұрақтарды қара. Жазба $1 с кейін басталады", uz: "Savollarni ko‘ring. Yozuv $1 s dan keyin boshlanadi" }],
    [/^Запись закончилась\. Проверь ответы и отправляй\.$/, { en: "Recording finished. Check your answers and submit.", kz: "Жазба бітті. Жауаптарды тексеріп жібер.", uz: "Yozuv tugadi. Javoblarni tekshirib yuboring." }],
    [/^Идёт запись…$/, { en: "Recording…", kz: "Жазба жүріп жатыр…", uz: "Yozilmoqda…" }],
    [/^Цель взята\. Держи планку\.$/, { en: "Target reached. Keep it up.", kz: "Мақсат орындалды. Ұстап тұр.", uz: "Maqsadga erishildi. Davom eting." }],
    [/^До цели ([\d.]+) совсем близко\.$/, { en: "Very close to target $1.", kz: "Мақсат $1-ге өте жақын.", uz: "Maqsad $1 ga juda yaqin." }],
    [/^До цели ([\d.]+): ([\d.]+)\. Разбери ошибки и вернись\.$/, { en: "To target $1: $2. Review mistakes and come back.", kz: "Мақсат $1: $2. Қателерді талдап, қайта кел.", uz: "Maqsad $1: $2. Xatolarni ko‘rib chiqib, qaytib keling." }],
    [/^(Reading|Listening|Writing|Speaking) · (\d+) из (\d+)$/, { en: "$1 · $2 of $3", kz: "$1 · $2 / $3", uz: "$1 · $2 / $3" }],
    [/^Ты: (.+)$/, { en: "You: $1", kz: "Сен: $1", uz: "Siz: $1" }]
  ];

  function tr(text) {
    var t = text.trim();
    if (!t) return null;
    var arrow = "";
    if (/^[←→›»]\s+/.test(t)) { arrow = t.charAt(0) + " "; t = t.slice(2).trim(); }
    var ex = pick(t);
    if (ex) return arrow + ex;
    for (var i = 0; i < RX.length; i++) {
      var m = t.match(RX[i][0]);
      if (m) {
        var rep = RX[i][1][lang] || RX[i][1].en;
        var out = rep.replace(/\$(\d)/g, function (_x, n) { return m[+n] || ""; });
        return arrow + out;
      }
    }
    return null;
  }

  function walk(node) {
    if (!node) return;
    if (node.nodeType === 3) {
      var v = tr(node.nodeValue);
      if (v != null) node.nodeValue = node.nodeValue.replace(node.nodeValue.trim(), v);
      return;
    }
    if (node.nodeType !== 1) return;
    var tag = node.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA" || node.isContentEditable) return;
    for (var c = node.firstChild; c; c = c.nextSibling) walk(c);
  }

  function boot() {
    walk(d.body);
    try {
      var mo = new MutationObserver(function (ms) {
        for (var i = 0; i < ms.length; i++) {
          for (var j = 0; j < ms[i].addedNodes.length; j++) walk(ms[i].addedNodes[j]);
        }
      });
      mo.observe(d.body, { childList: true, subtree: true });
    } catch (e) {}
  }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", boot); else boot();
})(window, document);
