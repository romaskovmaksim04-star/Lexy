/* ==========================================================
   lexy-course.js — курсы Lexy (разговорный английский)
   • Уровни A1–C1, в каждом 90 дней по 5 блоков
   • Каждые 7 дней — тест уровня; сдал хорошо → переход вперёд
   • Бесплатно только первые 3 дня вводного уровня
   • Задания собираются из банка (ротация), у Listening — аудио
   ========================================================== */
(function (w) {
  "use strict";

  var LEVELS = ["A1", "A2", "B1", "B2", "C1"];
  var DAYS = 90;
  var FREE_DAYS = 3;
  var BLOCKS = ["theory", "vocab", "listening", "reading", "quiz"];
  var BLOCK_LABEL = { theory: "Практика с объяснением", vocab: "Слова", listening: "Аудирование", reading: "Чтение/грамматика", speaking: "Говорение", quiz: "Практика" };

  /* ---------- ГРАММАТИКА (практика с объяснением) ---------- */
  var GRAMMAR = {
    A1: [
      { t: "Глагол to be", e: "I am, you are, he/she/it is, we/they are. Используем, чтобы сказать кто/что есть.", ex: ["I am a student.", "She is happy.", "They are at home."] },
      { t: "Present Simple", e: "Простое настоящее — для фактов и привычек. С he/she/it добавляем -s.", ex: ["I work every day.", "She works in a shop.", "They play football."] },
      { t: "Артикли a / an / the", e: "a — перед согласной, an — перед гласной, the — когда предмет конкретный.", ex: ["a cat", "an apple", "the cat on the table"] },
      { t: "Множественное число", e: "Обычно +s. После -s/-x/-ch: +es. city → cities.", ex: ["one book — two books", "one box — two boxes", "one city — two cities"] },
      { t: "There is / There are", e: "There is — для одного, There are — для многих.", ex: ["There is a table.", "There are two chairs."] },
      { t: "Модальный can", e: "can + глагол без to — про умение и возможность.", ex: ["I can swim.", "She can cook."] },
      { t: "Предлоги места", e: "in — внутри, on — на поверхности, under — под.", ex: ["The pen is in the bag.", "The book is on the table.", "The cat is under the chair."] },
      { t: "Like / want", e: "like — нравится, want — хотеть. Далее обычно существительное.", ex: ["I like tea.", "She wants water."] }
    ],
    A2: [
      { t: "Present Continuous", e: "am/is/are + глагол-ing — действие прямо сейчас.", ex: ["I am reading now.", "She is working."] },
      { t: "Past Simple", e: "Прошедшее: правильные глаголы +ed, неправильные — особые формы.", ex: ["I visited my friend.", "She went to London."] },
      { t: "Сравнения", e: "Короткие: +er (bigger). Длинные: more + слово (more interesting).", ex: ["A car is faster than a bike.", "This book is more interesting."] },
      { t: "Модальные should / must / might", e: "should — совет, must — обязанность, might — вероятность.", ex: ["You should rest.", "I must go.", "They might come."] },
      { t: "Much / many / a few", e: "many — с исчисляемыми, much — с неисчисляемыми, a few — немного (считаемые).", ex: ["How many friends?", "How much water?", "a few apples"] },
      { t: "Будущее: will / going to", e: "will — решение сейчас, going to — план заранее.", ex: ["I will help you.", "We are going to travel."] }
    ],
    B1: [
      { t: "Present Perfect", e: "have/has + 3-я форма. Результат к настоящему, опыт. for — длительность, since — с момента.", ex: ["I have lived here for five years.", "She has just finished."] },
      { t: "Условные 1 и 2", e: "1-й: If + present, will. 2-й: If + past, would.", ex: ["If it rains, I will stay.", "If I had time, I would travel."] },
      { t: "Пассивный залог", e: "be + 3-я форма, когда важно действие, а не кто его сделал.", ex: ["The house was built in 1990.", "English is spoken here."] },
      { t: "Косвенная речь", e: "He said (that)… Со временем сдвиг: is → was, will → would.", ex: ["He said he was tired.", "She told me she would come."] },
      { t: "Связки", e: "although — хотя, however — однако, therefore — следовательно.", ex: ["Although it was cold, we went out.", "She studied hard; therefore she passed."] },
      { t: "Relative clauses", e: "who — для людей, which — для вещей, that — для обоих.", ex: ["The man who called is my boss.", "The book which I read was great."] }
    ],
    B2: [
      { t: "Условные 3", e: "If + had + 3-я форма, would have + 3-я форма — про прошлое.", ex: ["If I had known, I would have called."] },
      { t: "Инверсия для акцента", e: "Not only did he…, Rarely have we… — усиление в формальном стиле.", ex: ["Not only did the policy cut costs, but it also helped.", "Rarely have we seen such change."] },
      { t: "Формальные связки", e: "Furthermore, Nevertheless, Consequently, Provided that, Unless.", ex: ["Furthermore, the data support this.", "Unless costs fall, demand stays weak."] },
      { t: "Модальные с перфектом", e: "should have / might have / could have + 3-я форма — оценка прошлого.", ex: ["You should have told me.", "They might have left already."] }
    ],
    C1: [
      { t: "Точные связки", e: "Наличие оттенка: admittedly, arguably, notably, conversely.", ex: ["Admittedly, the plan has flaws; nevertheless, it is worth trying."] },
      { t: "Уточнение и хеджирование", e: "Смягчение утверждений: arguably, to some extent, it could be argued.", ex: ["It could be argued that the measure is premature."] },
      { t: "Сложные именные фразы", e: "Академическая плотность: 'the rapidly growing reliance on digital platforms'.", ex: ["The growing reliance on remote tools altered workflows."] },
      { t: "Идиоматическая точность", e: "bear in mind, a double-edged sword, in the long run.", ex: ["It is a double-edged sword.", "Bear in mind the wider context."] }
    ],
    C2: [
      { t: "Стилистический регистр", e: "Точный выбор между формальным и нейтральным выражением.", ex: ["The findings are indicative rather than conclusive."] },
      { t: "Академическая аргументация", e: "Тезис → данные → оговорка → вывод, с чёткими связками.", ex: ["The evidence, while suggestive, is not decisive."] }
    ]
  };

  var LEVEL_TITLE = { A1: "Начальный", A2: "Элементарный", B1: "Средний", B2: "Выше среднего", C1: "Продвинутый" };
  var GOALS = [
    { id: "study", t: "Учёба" },
    { id: "travel", t: "Путешествия" },
    { id: "work", t: "Работа" },
    { id: "move", t: "Переезд" }
  ];

  /* ---------- БАНК ЗАДАНИЙ ---------- */
  var BANK = {
    A1: {
      vocab: [
        { t: "Приветствие", w: [["hello", "привет"], ["hi", "привет (неформ.)"], ["good morning", "доброе утро"], ["good evening", "добрый вечер"], ["bye", "пока"], ["please", "пожалуйста"], ["thank you", "спасибо"], ["sorry", "извини"]] },
        { t: "Знакомство", w: [["name", "имя"], ["my name is", "меня зовут"], ["nice to meet you", "приятно познакомиться"], ["how are you", "как дела"], ["fine", "хорошо"], ["friend", "друг"], ["I am from", "я из"], ["years old", "лет"]] },
        { t: "Семья", w: [["mother", "мама"], ["father", "папа"], ["sister", "сестра"], ["brother", "брат"], ["son", "сын"], ["daughter", "дочь"], ["family", "семья"], ["parents", "родители"]] },
        { t: "Числа", w: [["one", "один"], ["two", "два"], ["three", "три"], ["ten", "десять"], ["twenty", "двадцать"], ["hundred", "сто"], ["first", "первый"], ["last", "последний"]] },
        { t: "Еда", w: [["bread", "хлеб"], ["water", "вода"], ["milk", "молоко"], ["apple", "яблоко"], ["tea", "чай"], ["coffee", "кофе"], ["egg", "яйцо"], ["rice", "рис"]] },
        { t: "Дом", w: [["house", "дом"], ["room", "комната"], ["door", "дверь"], ["window", "окно"], ["table", "стол"], ["chair", "стул"], ["bed", "кровать"], ["kitchen", "кухня"]] },
        { t: "Город", w: [["street", "улица"], ["shop", "магазин"], ["school", "школа"], ["park", "парк"], ["bank", "банк"], ["hospital", "больница"], ["bus stop", "автобусная остановка"], ["map", "карта"]] },
        { t: "Время", w: [["today", "сегодня"], ["tomorrow", "завтра"], ["yesterday", "вчера"], ["morning", "утро"], ["evening", "вечер"], ["week", "неделя"], ["month", "месяц"], ["year", "год"]] },
        { t: "Цвета", w: [["red", "красный"], ["blue", "синий"], ["green", "зелёный"], ["black", "чёрный"], ["white", "белый"], ["yellow", "жёлтый"], ["brown", "коричневый"], ["grey", "серый"]] },
        { t: "Глаголы", w: [["go", "идти"], ["come", "приходить"], ["eat", "есть"], ["drink", "пить"], ["read", "читать"], ["write", "писать"], ["speak", "говорить"], ["listen", "слушать"]] }
      ],
      listening: [
        { t: "Утро", script: "Good morning! My name is Anna. I am a student. Every morning I drink tea and eat bread. Then I go to school by bus.", q: [{ q: "Что Анна пьёт утром?", o: ["Кофе", "Чай", "Молоко", "Воду"], a: 1 }, { q: "Как Анна идёт в школу?", o: ["На автобусе", "Пешком", "На машине", "На метро"], a: 0 }] },
        { t: "В кафе", script: "Hello, I would like a coffee and an apple, please. That is three pounds. Thank you very much.", q: [{ q: "Что заказывают?", o: ["Чай и хлеб", "Кофе и яблоко", "Воду и яйцо", "Молоко и рис"], a: 1 }, { q: "Сколько стоит?", o: ["Три фунта", "Два фунта", "Пять фунтов", "Один фунт"], a: 0 }] },
        { t: "Семья", script: "I have one brother and two sisters. My brother is ten years old. My family is big and happy.", q: [{ q: "Сколько сестёр?", o: ["Одна", "Две", "Три", "Нет"], a: 1 }, { q: "Сколько лет брату?", o: ["Пять", "Десять", "Двадцать", "Три"], a: 1 }] },
        { t: "Дом", script: "This is my house. The kitchen is small but the living room is big. There is a big window in my room.", q: [{ q: "Какая кухня?", o: ["Большая", "Маленькая", "Новая", "Старая"], a: 1 }, { q: "Что есть в комнате?", o: ["Дверь", "Окно", "Стол", "Стул"], a: 1 }] },
        { t: "Погода", script: "Today is a nice day. It is warm and sunny. Tomorrow it will be cold and grey, so take a jacket.", q: [{ q: "Какая погода сегодня?", o: ["Холодно", "Тепло и солнечно", "Дождливо", "Снежно"], a: 1 }, { q: "Что взять на завтра?", o: ["Зонт", "Куртку", "Шляпу", "Очки"], a: 1 }] },
        { t: "Магазин", script: "Good afternoon. How much is this apple? One pound. And the bread is two pounds. Here you are. Thank you.", q: [{ q: "Сколько стоит яблоко?", o: ["Один фунт", "Два фунта", "Три фунта", "Пять"], a: 0 }, { q: "Сколько стоит хлеб?", o: ["Один", "Два", "Четыре", "Шесть"], a: 1 }] },
        { t: "Время", script: "Excuse me, what time is it? It is half past eight. Oh, I am late. The lesson starts at nine.", q: [{ q: "Сколько времени?", o: ["8:30", "9:00", "8:00", "9:30"], a: 0 }, { q: "Когда начинается урок?", o: ["8:00", "8:30", "9:00", "10:00"], a: 2 }] },
        { t: "Друзья", script: "Hi, this is my friend Tom. He is from Canada. He speaks English and a little French. We play football on Sundays.", q: [{ q: "Откуда Том?", o: ["Из Англии", "Из Канады", "Из США", "Из Франции"], a: 1 }, { q: "Что они делают в воскресенье?", o: ["Читают", "Играют в футбол", "Плавают", "Готовят"], a: 1 }] },
        { t: "Телефон", script: "Hello, can I speak to Mary, please? I am sorry, she is not at home. Can I leave a message? Yes, please.", q: [{ q: "Кого зовут к телефону?", o: ["Анну", "Мэри", "Тома", "Джона"], a: 1 }, { q: "Что предлагают?", o: ["Перезвонить", "Оставить сообщение", "Прийти позже", "Написать письмо"], a: 1 }] },
        { t: "Работа", script: "My father is a doctor. He works in a hospital. He starts work at eight in the morning and comes home at six.", q: [{ q: "Кто отец по профессии?", o: ["Учитель", "Врач", "Водитель", "Повар"], a: 1 }, { q: "Когда он приходит домой?", o: ["В 6", "В 8", "В 5", "В 9"], a: 0 }] }
      ],
      reading: [
        { t: "Введение в to be", p: "I am a student. You are my friend. He is from Spain. We are happy. They are at home.", q: [{ q: "Выберите верно:", o: ["She are happy", "She is happy", "She am happy", "She be happy"], a: 1 }, { q: "«Я студент»:", o: ["I is a student", "I am a student", "I are a student", "I be a student"], a: 1 }] },
        { t: "Артикли", p: "This is a cat. The cat is black. An apple is on the table. I see a table and a chair.", q: [{ q: "Какой вариант верный?", o: ["I have an apple", "I have a apple", "I have apple", "I have the apple"], a: 0 }] },
        { t: "Present Simple", p: "I work every day. She works in a shop. He eats bread in the morning. They play in the park.", q: [{ q: "Верно:", o: ["She work", "She works", "She working", "She is work"], a: 1 }, { q: "Верно:", o: ["He eat", "He eats", "He eating", "He is eat"], a: 1 }] },
        { t: "Множественное число", p: "one cat — two cats. one box — two boxes. one city — two cities.", q: [{ q: "Множественное от «bus»:", o: ["bus", "buss", "buses", "buse"], a: 2 }, { q: "Множественное от «city»:", o: ["citys", "cities", "cityes", "city"], a: 1 }] },
        { t: "Местоимения", p: "I see Tom. I see him. She likes Anna. She likes her. We help you.", q: [{ q: "Заменить «Tom»:", o: ["I see he", "I see him", "I see his", "I see he's"], a: 1 }, { q: "Заменить «Anna»:", o: ["likes she", "likes her", "likes hers", "likes she's"], a: 1 }] },
        { t: "Like / want", p: "I like tea. She likes coffee. I want water. They want bread.", q: [{ q: "Верно:", o: ["She like tea", "She likes tea", "She liking tea", "She is like tea"], a: 1 }] },
        { t: "There is / are", p: "There is a table in the room. There are two chairs. There is a window here.", q: [{ q: "Два стула:", o: ["There is two chairs", "There are two chairs", "There two chairs", "It is two chairs"], a: 1 }] },
        { t: "Can", p: "I can swim. She can cook. We can help you. Can you drive?", q: [{ q: "Верно:", o: ["She can to cook", "She can cook", "She cans cook", "She can cooking"], a: 1 }] },
        { t: "Вопросы", p: "Where are you from? What is your name? How old are you? How are you?", q: [{ q: "Как спросить имя?", o: ["What you name", "What is your name", "How is your name", "Where your name"], a: 1 }] },
        { t: "Предлоги места", p: "The book is on the table. The cat is under the chair. The pen is in the bag.", q: [{ q: "Кот ПОД стулом:", o: ["on", "in", "under", "at"], a: 2 }, { q: "Ручка В сумке:", o: ["on", "in", "under", "at"], a: 1 }] }
      ],
      speaking: [
        { t: "Знакомство", prompt: "Tell about yourself.", points: ["your name", "where you are from", "your age", "what you do"] },
        { t: "Семья", prompt: "Tell about your family.", points: ["how many people", "mother and father", "brothers or sisters", "one thing you do together"] },
        { t: "Мой день", prompt: "Describe your usual day.", points: ["what time you get up", "what you eat", "where you go", "what you do in the evening"] },
        { t: "Дом", prompt: "Describe your home.", points: ["where it is", "how many rooms", "your favourite room", "what you like about it"] },
        { t: "Еда", prompt: "Talk about food you like.", points: ["favourite food", "food you don't like", "who cooks", "when you eat it"] },
        { t: "Хобби", prompt: "Talk about what you do in your free time.", points: ["your hobby", "why you like it", "how often you do it", "who does it with you"] },
        { t: "Друзья", prompt: "Describe your best friend.", points: ["who they are", "how you met", "what you do together", "why they are your friend"] },
        { t: "Город", prompt: "Describe your city or town.", points: ["where it is", "what places are famous", "what you can do there", "what you like about it"] },
        { t: "Погода и времена года", prompt: "Talk about your favourite season.", points: ["which season", "what the weather is like", "what you wear", "what you do then"] },
        { t: "Учёба", prompt: "Talk about your studies.", points: ["what you study", "where you study", "what subject you like", "why"] }
      ],
      quiz: [
        { t: "Практика 1", q: [{ q: "Я студент:", o: ["I am a student", "I is a student", "I a student", "I are student"], a: 0 }, { q: "Она врач:", o: ["She a doctor", "She is a doctor", "She am doctor", "She are doctor"], a: 1 }, { q: "Спасибо:", o: ["Sorry", "Please", "Thank you", "Hello"], a: 2 }, { q: "Приятно познакомиться:", o: ["Nice to meet you", "How are you", "See you", "Good night"], a: 0 }] },
        { t: "Практика 2", q: [{ q: "Множественное от «child»:", o: ["childs", "childes", "children", "child"], a: 2 }, { q: "Я люблю чай:", o: ["I like tea", "I likes tea", "I am like tea", "I liking tea"], a: 0 }, { q: "Где ты?:", o: ["Where you are", "Where are you", "Where is you", "Where you"], a: 1 }, { q: "Два стула есть:", o: ["There is two chairs", "There are two chairs", "It is two chairs", "There two chairs"], a: 1 }] },
        { t: "Практика 3", q: [{ q: "Я могу плавать:", o: ["I can swim", "I can to swim", "I cans swim", "I can swimming"], a: 0 }, { q: "Книга на столе:", o: ["in the table", "on the table", "under the table", "at the table"], a: 1 }, { q: "Он ест хлеб:", o: ["He eat bread", "He eats bread", "He eating", "He is eat"], a: 1 }, { q: "Доброе утро:", o: ["Good night", "Good morning", "Good evening", "Good bye"], a: 1 }] },
        { t: "Практика 4", q: [{ q: "Мне нужна вода:", o: ["I want water", "I wants water", "I wanting water", "I am want water"], a: 0 }, { q: "Откуда ты?:", o: ["Where are you from", "Where from you", "How you from", "What you from"], a: 0 }, { q: "Один автобус — два ...:", o: ["bus", "buses", "buss", "buse"], a: 1 }, { q: "Извините:", o: ["Please", "Sorry", "Thanks", "Hi"], a: 1 }] },
        { t: "Практика 5", q: [{ q: "У меня есть брат:", o: ["I have a brother", "I has a brother", "I am have brother", "I having brother"], a: 0 }, { q: "Сколько тебе лет?:", o: ["How old you", "How old are you", "What old you", "How years you"], a: 1 }, { q: "Заменить «Mary»:", o: ["I see she", "I see her", "I see hers", "I see she's"], a: 1 }, { q: "Пока:", o: ["Hello", "Hi", "Bye", "Please"], a: 2 }] },
        { t: "Практика 6", q: [{ q: "Я не знаю:", o: ["I not know", "I don't know", "I doesn't know", "I no know"], a: 1 }, { q: "Верно:", o: ["She don't like", "She doesn't like", "She not like", "She no like"], a: 1 }, { q: "Половина девятого:", o: ["8:30", "9:00", "9:30", "8:00"], a: 0 }, { q: "Добрый вечер:", o: ["Good morning", "Good evening", "Good night", "Good day"], a: 1 }] }
      ]
    },

    A2: {
      vocab: [
        { t: "Работа и учёба", w: [["meeting", "встреча"], ["office", "офис"], ["schedule", "расписание"], ["colleague", "коллега"], ["subject", "предмет"], ["exam", "экзамен"], ["homework", "домашняя работа"], ["deadline", "срок"]] },
        { t: "Путешествия", w: [["airport", "аэропорт"], ["ticket", "билет"], ["luggage", "багаж"], ["booking", "бронь"], ["passport", "паспорт"], ["platform", "платформа"], ["delay", "задержка"], ["arrival", "прибытие"]] },
        { t: "Здоровье", w: [["headache", "головная боль"], ["medicine", "лекарство"], ["appointment", "приём у врача"], ["exercise", "упражнения"], ["healthy", "здоровый"], ["pain", "боль"], ["tired", "уставший"], ["sleep", "сон"]] },
        { t: "Покупки", w: [["receipt", "чек"], ["discount", "скидка"], ["cash", "наличные"], ["card", "карта"], ["size", "размер"], ["try on", "примерить"], ["refund", "возврат денег"], ["queue", "очередь"]] },
        { t: "Технологии", w: [["device", "устройство"], ["screen", "экран"], ["password", "пароль"], ["download", "скачать"], ["charge", "заряжать"], ["update", "обновление"], ["storage", "память"], ["wireless", "беспроводной"]] },
        { t: "Погода и природа", w: [["forecast", "прогноз"], ["cloudy", "облачно"], ["rainy", "дождливо"], ["temperature", "температура"], ["forest", "лес"], ["river", "река"], ["environment", "окружающая среда"], ["weather", "погода"]] },
        { t: "Работа по дому", w: [["clean", "убирать"], ["wash", "мыть"], ["cook", "готовить"], ["repair", "ремонтировать"], ["tidy", "прибирать"], ["furniture", "мебель"], ["laundry", "стирка"], ["spend", "тратить"]] },
        { t: "Чувства", w: [["happy", "счастливый"], ["worried", "встревоженный"], ["excited", "взволнованный"], ["angry", "злой"], ["surprised", "удивлённый"], ["nervous", "нервный"], ["proud", "гордый"], ["bored", "скучающий"]] }
      ],
      listening: [
        { t: "Планы на выходные", script: "What are you doing this weekend? I'm going to visit my grandmother on Saturday, and on Sunday I'll probably stay at home and relax.", q: [{ q: "Что в субботу?", o: ["Отдыхает дома", "Навестит бабушку", "Идёт на работу", "Едет в кино"], a: 1 }, { q: "Что в воскресенье?", o: ["Отдыхает дома", "Навестит бабушку", "Работает", "Путешествует"], a: 0 }] },
        { t: "В аэропорту", script: "I'm sorry, your flight to Paris is delayed by two hours. The new departure time is four thirty. Please wait at gate twelve.", q: [{ q: "На сколько задержка?", o: ["1 час", "2 часа", "3 часа", "30 минут"], a: 1 }, { q: "У каких ворот ждать?", o: ["Gate 2", "Gate 12", "Gate 20", "Gate 4"], a: 1 }] },
        { t: "У врача", script: "You should take this medicine twice a day, after meals. If you still feel pain in three days, please make another appointment.", q: [{ q: "Как принимать лекарство?", o: ["Раз в день", "Два раза в день", "Три раза", "Перед едой"], a: 1 }, { q: "Что делать через 3 дня?", o: ["Прекратить", "Записаться ещё раз", "Увеличить дозу", "Ничего"], a: 1 }] },
        { t: "В магазине", script: "This jacket is sixty pounds, but it's in the sale at half price today. There's a changing room over there if you want to try it on.", q: [{ q: "Сколько сейчас стоит куртка?", o: ["£60", "£30", "£40", "£20"], a: 1 }, { q: "Где можно примерить?", o: ["У кассы", "В примерочной", "У входа", "Наверху"], a: 1 }] },
        { t: "Съём жилья", script: "The flat has two bedrooms and a small kitchen. The rent is eight hundred a month, and that includes water but not electricity.", q: [{ q: "Сколько спален?", o: ["Одна", "Две", "Три", "Нет"], a: 1 }, { q: "Что включено в аренду?", o: ["Электричество", "Вода", "Интернет", "Всё"], a: 1 }] },
        { t: "Учёба", script: "The course lasts twelve weeks with classes twice a week. You need to bring your own laptop, but the books are provided.", q: [{ q: "Сколько длится курс?", o: ["6 недель", "12 недель", "20 недель", "8 недель"], a: 1 }, { q: "Что нужно принести?", o: ["Учебники", "Ноутбук", "Еду", "Форму"], a: 1 }] },
        { t: "На работе", script: "Could you send me the report by Friday, please? Also, let's schedule a short call for Monday morning to go over the numbers.", q: [{ q: "Когда нужен отчёт?", o: ["В понедельник", "К пятнице", "Сегодня", "Завтра"], a: 1 }, { q: "Что на понедельник?", o: ["Отчёт", "Короткий звонок", "Встреча в офисе", "Отпуск"], a: 1 }] },
        { t: "В ресторане", script: "Good evening. A table for two? Yes, please. Would you like to see the menu? The soup of the day is tomato, and the fish is very good tonight.", q: [{ q: "На сколько столик?", o: ["На одного", "На двоих", "На троих", "На четверых"], a: 1 }, { q: "Суп дня?", o: ["Куриный", "Томатный", "Грибной", "Овощной"], a: 1 }] }
      ],
      reading: [
        { t: "Present Continuous", p: "I am reading now. She is working at the moment. They are playing football. We are not watching TV.", q: [{ q: "Верно:", o: ["She works now", "She is working now", "She working now", "She work now"], a: 1 }, { q: "Отрицание:", o: ["We not watching", "We are not watching", "We don't watching", "We no watch"], a: 1 }] },
        { t: "Past Simple", p: "I visited my friend yesterday. She went to London last year. They watched a film. He did not come.", q: [{ q: "Прошлое от «go»:", o: ["goed", "went", "gone", "going"], a: 1 }, { q: "Отрицание:", o: ["He not came", "He didn't come", "He doesn't come", "He no come"], a: 1 }] },
        { t: "Сравнения", p: "A car is faster than a bike. This book is more interesting than that one. She is the tallest in the class.", q: [{ q: "Сравнение «big»:", o: ["more big", "bigger", "biggest", "most big"], a: 1 }, { q: "Превосходная «good»:", o: ["goodest", "best", "better", "most good"], a: 1 }] },
        { t: "Модальные глаголы", p: "You should rest. I must go now. She can speak three languages. They might come later.", q: [{ q: "Совет:", o: ["You must", "You should", "You might", "You can"], a: 1 }, { q: "Способность:", o: ["must", "should", "can", "might"], a: 2 }] },
        { t: "Исчисляемые/неисчисляемые", p: "I need some water. There are a few apples. She has much work. How many friends do you have?", q: [{ q: "С «water»:", o: ["many", "much", "few", "a few"], a: 1 }, { q: "С «apples»:", o: ["much", "many", "a little", "less"], a: 1 }] },
        { t: "Go to / in / at", p: "I go to work at nine. She studies at university. We arrived in London. He is at home.", q: [{ q: "«работать»:", o: ["go in work", "go to work", "go at work", "go work"], a: 1 }, { q: "«дома»:", o: ["in home", "at home", "on home", "to home"], a: 1 }] }
      ],
      speaking: [
        { t: "Планы", prompt: "Talk about your plans for next week.", points: ["what you will do", "where you will go", "who with", "why it is important"] },
        { t: "Прошлый отпуск", prompt: "Describe your last holiday.", points: ["where you went", "who you went with", "what you did", "what you liked most"] },
        { t: "Работа мечты", prompt: "Talk about your dream job.", points: ["what it is", "why you want it", "what skills you need", "where you would work"] },
        { t: "Здоровый образ жизни", prompt: "Talk about a healthy lifestyle.", points: ["what you eat", "how you exercise", "how much you sleep", "what you want to change"] },
        { t: "Технологии в жизни", prompt: "Talk about how you use technology.", points: ["your favourite device", "how often you use it", "apps you like", "how it helps you"] },
        { t: "Мой город", prompt: "Describe your city and its problems.", points: ["what is good", "what is bad", "traffic and transport", "what you would change"] }
      ],
      quiz: [
        { t: "Практика 1", q: [{ q: "Она сейчас работает:", o: ["She works now", "She is working now", "She work now", "She working now"], a: 1 }, { q: "Прошлое «go»:", o: ["goed", "went", "gone", "go"], a: 1 }, { q: "Ты должен отдохнуть:", o: ["You should rest", "You must rest", "You can rest", "You might rest"], a: 0 }, { q: "С «water»:", o: ["many", "much", "few", "a few"], a: 1 }] },
        { t: "Практика 2", q: [{ q: "Верно:", o: ["It's more cheap", "It's cheaper", "It's cheapest", "It's most cheap"], a: 1 }, { q: "Он не пришёл:", o: ["He not came", "He didn't come", "He doesn't come", "He no come"], a: 1 }, { q: "«дома»:", o: ["in home", "at home", "on home", "to home"], a: 1 }, { q: "Способность:", o: ["must", "should", "can", "might"], a: 2 }] }
      ]
    },

    B1: {
      vocab: [
        { t: "Работа и карьера", w: [["schedule", "планировать"], ["responsibility", "ответственность"], ["achieve", "достигать"], ["improve", "улучшать"], ["colleague", "коллега"], ["promotion", "повышение"], ["deadline", "срок"], ["experience", "опыт"]] },
        { t: "Мнения", w: [["in my opinion", "по-моему"], ["agree", "соглашаться"], ["disagree", "не соглашаться"], ["suggest", "предлагать"], ["however", "однако"], ["although", "хотя"], ["therefore", "следовательно"], ["for example", "например"]] },
        { t: "Проблемы и решения", w: [["issue", "проблема"], ["solve", "решать"], ["cause", "причина"], ["effect", "эффект"], ["advantage", "преимущество"], ["disadvantage", "недостаток"], ["improve", "улучшить"], ["avoid", "избегать"]] },
        { t: "Технологии и интернет", w: [["device", "устройство"], ["network", "сеть"], ["security", "безопасность"], ["application", "приложение"], ["data", "данные"], ["develop", "разрабатывать"], ["access", "доступ"], ["reliable", "надёжный"]] },
        { t: "Окружающая среда", w: [["pollution", "загрязнение"], ["recycle", "перерабатывать"], ["energy", "энергия"], ["climate", "климат"], ["waste", "отходы"], ["protect", "защищать"], ["reduce", "сокращать"], ["sustainable", "устойчивый"]] },
        { t: "Образование", w: [["degree", "степень"], ["research", "исследование"], ["knowledge", "знание"], ["skill", "навык"], ["attend", "посещать"], ["graduate", "выпускник"], ["facility", "оснащение"], ["curriculum", "программа"]] }
      ],
      listening: [
        { t: "Собеседование", script: "Thanks for coming in. Could you tell me about your experience and why you're interested in this role? I've worked in customer service for three years and I'd like to develop my skills further.", q: [{ q: "Сколько лет опыта?", o: ["Один", "Два", "Три", "Пять"], a: 2 }, { q: "Почему интересна роль?", o: ["Больше денег", "Развивать навыки", "Ближе к дому", "Меньше работы"], a: 1 }] },
        { t: "Презентация", script: "The main advantage of this approach is that it saves both time and money. However, we should be careful about the initial investment.", q: [{ q: "Главное преимущество?", o: ["Дешевле", "Экономит время и деньги", "Проще", "Быстрее"], a: 1 }, { q: "О чём предупреждают?", o: ["О рисках", "О начальных вложениях", "О времени", "О людях"], a: 1 }] },
        { t: "Новости", script: "Heavy rain is expected across the region this evening. Drivers are advised to avoid low roads and allow extra time for their journeys.", q: [{ q: "Что ожидается?", o: ["Снег", "Сильный дождь", "Жара", "Ветер"], a: 1 }, { q: "Совет водителям?", o: ["Ехать быстрее", "Избегать низких дорог", "Остаться дома", "Взять цепь"], a: 1 }] },
        { t: "Университет", script: "To apply for the scholarship, you must submit your application before the end of March and include two reference letters.", q: [{ q: "Срок подачи?", o: ["Конец марта", "Конец мая", "Начало марта", "Июнь"], a: 0 }, { q: "Что приложить?", o: ["Эссе", "Два рекомендательных письма", "Сертификат", "Фото"], a: 1 }] },
        { t: "Жалоба", script: "I'm calling about my order — it was supposed to arrive last week but I still haven't received it. I'd like either a replacement or a full refund.", q: [{ q: "Проблема?", o: ["Повреждение", "Не пришёл заказ", "Не тот размер", "Поздняя оплата"], a: 1 }, { q: "Что хотят?", o: ["Извинения", "Новый товар или возврат", "Скидку", "Ничего"], a: 1 }] },
        { t: "Путешествие", script: "The museum is free on Sundays, and guided tours start every hour from ten in the morning. The last tour begins at four.", q: [{ q: "Когда музей бесплатный?", o: ["По субботам", "По воскресеньям", "Всегда", "По утрам"], a: 1 }, { q: "Последний тур?", o: ["В 10", "В 12", "В 16", "В 18"], a: 2 }] }
      ],
      reading: [
        { t: "Present Perfect", p: "I have lived here for five years. She has just finished her work. They have never been abroad.", q: [{ q: "Верно:", o: ["I live here for 5 years", "I have lived here for 5 years", "I lived here 5 years", "I am living 5 years"], a: 1 }, { q: "«никогда не были»:", o: ["have never been", "never have be", "have never go", "never went have"], a: 0 }] },
        { t: "Условные (Conditionals)", p: "If it rains, I will stay home. If I had more time, I would travel. If I had known, I would have called.", q: [{ q: "Первый тип:", o: ["If it rains, I stay", "If it rains, I will stay", "If it will rain, I stay", "If rain, I stay"], a: 1 }, { q: "Второй тип:", o: ["If I had, I would", "If I have, I will", "If I has, I go", "If I am, I do"], a: 0 }] },
        { t: "Пассив", p: "The house was built in 1990. English is spoken here. The letters have been sent.", q: [{ q: "Верно:", o: ["The house built 1990", "The house was built in 1990", "The house is build 1990", "The house been built"], a: 1 }] },
        { t: "Косвенная речь", p: "He said that he was tired. She told me she would come later. They asked where I lived.", q: [{ q: "Верно:", o: ["He said he is tired", "He said that he was tired", "He say he tired", "He said he were tired"], a: 1 }] },
        { t: "Связки", p: "Although it was cold, we went out. She studied hard; therefore, she passed. However, the plan did not work.", q: [{ q: "Контраст:", o: ["therefore", "although", "because", "so"], a: 1 }, { q: "Результат:", o: ["however", "therefore", "although", "but"], a: 1 }] }
      ],
      speaking: [
        { t: "Мнение", prompt: "Give your opinion on working from home.", points: ["advantages", "disadvantages", "your experience", "what you recommend"] },
        { t: "Проблема и решение", prompt: "Talk about a problem in your city and how to solve it.", points: ["describe the problem", "who it affects", "possible solutions", "what you would do"] },
        { t: "Роль технологий", prompt: "Discuss how technology changed learning.", points: ["before and now", "apps and online courses", "advantages", "risks"] },
        { t: "Экология", prompt: "Talk about protecting the environment.", points: ["main problems", "what people can do", "what governments can do", "your own habits"] }
      ],
      quiz: [
        { t: "Практика 1", q: [{ q: "Я живу здесь 5 лет:", o: ["I live here 5 years", "I have lived here for 5 years", "I lived here for 5 years", "I am living 5 years"], a: 1 }, { q: "Если будет дождь, останусь:", o: ["If rains, I stay", "If it rains, I will stay", "If it will rain, I stay", "If rain, I stay"], a: 1 }, { q: "Дом был построен:", o: ["was built", "built", "is build", "has build"], a: 0 }, { q: "Контраст:", o: ["therefore", "although", "because", "so"], a: 1 }] }
      ]
    },

    B2: {
      vocab: [
        { t: "Аргументация", w: [["nevertheless", "тем не менее"], ["furthermore", "к тому же"], ["consequently", "следовательно"], ["assumption", "предположение"], ["evidence", "доказательство"], ["implication", "следствие"], ["controversial", "спорный"], ["significant", "значительный"]] },
        { t: "Работа и бизнес", w: [["negotiate", "вести переговоры"], ["implement", "внедрять"], ["efficient", "эффективный"], ["stakeholder", "заинтересованная сторона"], ["sustainable", "устойчивый"], ["strategy", "стратегия"], ["allocate", "распределять"], ["leverage", "использовать"]] },
        { t: "Общество", w: [["inequality", "неравенство"], ["welfare", "благосостояние"], ["cohesion", "сплочённость"], ["diverse", "разнообразный"], ["integrate", "интегрировать"], ["urbanisation", "урбанизация"], ["demographic", "демографический"], ["infrastructure", "инфраструктура"]] },
        { t: "Наука и исследования", w: [["hypothesis", "гипотеза"], ["analyse", "анализировать"], ["correlation", "корреляция"], ["significant", "значимый"], ["methodology", "методология"], ["conclude", "делать вывод"], ["reliable", "надёжный"], ["valid", "обоснованный"]] }
      ],
      listening: [
        { t: "Дебаты", script: "While the proposal has clear financial benefits, we must also consider the long-term environmental impact. On balance, I believe the advantages outweigh the risks, provided that we monitor the results closely.", q: [{ q: "Что признаёт говорящий?", o: ["Только плюсы", "Финансовую выгоду и риск", "Только экологию", "Ничего"], a: 1 }, { q: "Итоговая позиция?", o: ["Против", "За, при контроле", "Нейтрально", "Не ясно"], a: 1 }] },
        { t: "Лекция", script: "Recent research suggests that sleep plays a crucial role in consolidating memory. Participants who slept after learning new material recalled significantly more than those who stayed awake.", q: [{ q: "Вывод исследования?", o: ["Сон мешает", "Сон укрепляет память", "Сон не влияет", "Нужно меньше сна"], a: 1 }, { q: "Кто запомнил больше?", o: ["Кто бодрствовал", "Кто спал", "Одинаково", "Никто"], a: 1 }] },
        { t: "Собеседование", script: "What attracted me to this company is its commitment to sustainability. In my previous role I led a project that reduced waste by thirty per cent without increasing costs.", q: [{ q: "Что привлекает?", o: ["Зарплата", "Устойчивое развитие", "Локация", "Отпуск"], a: 1 }, { q: "Результат проекта?", o: ["Рост затрат", "Снижение отходов на 30%", "Больше команды", "Новый офис"], a: 1 }] },
        { t: "Новости", script: "The government announced new measures to tackle rising energy costs, including subsidies for low-income households and investment in renewable sources.", q: [{ q: "Что объявлено?", o: ["Повышение налогов", "Меры против роста цен", "Закрытие станций", "Новый налог"], a: 1 }, { q: "Кому субсидии?", o: ["Компаниям", "Малым семьям с низким доходом", "Банкам", "Всем"], a: 1 }] }
      ],
      reading: [
        { t: "Формальный стиль", p: "The increasing reliance on digital platforms has transformed the way organisations operate. Consequently, employees require continuous training to remain competitive.", q: [{ q: "Следствие:", o: ["However", "Consequently", "Although", "Because"], a: 1 }] },
        { t: "Инверсия и акценты", p: "Not only did the policy reduce costs, but it also improved public trust. Rarely have we seen such rapid change.", q: [{ q: "Верно:", o: ["Not only the policy reduced", "Not only did the policy reduce", "Not only reduced the policy", "Not only reduce policy"], a: 1 }] },
        { t: "Сложные связки", p: "Provided that funding continues, the project will proceed. Unless costs fall, demand is likely to remain weak.", q: [{ q: "Условие:", o: ["Unless", "Provided that", "Although", "Whereas"], a: 1 }] }
      ],
      speaking: [
        { t: "Дискуссия", prompt: "Discuss whether university education should be free.", points: ["arguments for", "arguments against", "your position", "possible compromise"] },
        { t: "Проблемы современности", prompt: "Discuss a major challenge facing society today.", points: ["describe the challenge", "causes", "effects", "solutions"] }
      ],
      quiz: [
        { t: "Практика 1", q: [{ q: "Следствие:", o: ["However", "Consequently", "Although", "Because"], a: 1 }, { q: "Инверсия:", o: ["Not only it did", "Not only did it", "Not only it", "Did not only"], a: 1 }, { q: "Условие:", o: ["Unless", "Provided that", "Although", "Whereas"], a: 1 }, { q: "«тем не менее»:", o: ["furthermore", "nevertheless", "therefore", "for example"], a: 1 }] }
      ]
    },

    C1: {
      vocab: [
        { t: "Продвинутая лексика", w: [["nuance", "нюанс"], ["coherent", "связный"], ["pragmatic", "прагматичный"], ["ambiguous", "двусмысленный"], ["underscore", "подчёркивать"], ["mitigate", "смягчать"], ["advocate", "выступать за"], ["inherent", "присущий"]] },
        { t: "Академическая речь", w: [["notably", "в частности"], ["arguably", "возможно"], ["scrutinise", "тщательно изучать"], ["paradigm", "парадигма"], ["substantiate", "обосновывать"], ["delineate", "очерчивать"], ["qualitative", "качественный"], ["empirical", "эмпирический"]] },
        { t: "Идиомы", w: [["bear in mind", "иметь в виду"], ["a double-edged sword", "палка о двух концах"], ["cut corners", "халтурить"], ["on the whole", "в целом"], ["to some extent", "в некоторой степени"], ["in the long run", "в долгосрочной перспективе"], ["get the gist", "уловить суть"], ["touch on", "затрагивать"]] }
      ],
      listening: [
        { t: "Академическая лекция", script: "The evidence, while suggestive, is far from conclusive. To substantiate the claim, researchers would need a larger, more diverse sample and a clearer methodology. Until then, we should treat the findings with caution.", q: [{ q: "Как автор оценивает доказательства?", o: ["Убедительные", "Недостаточные", "Ложные", "Полные"], a: 1 }, { q: "Что нужно для подтверждения?", o: ["Меньше данных", "Большая выборка", "Новая теория", "Другой вопрос"], a: 1 }] },
        { t: "Дебаты (высокий уровень)", script: "Advocates of the reform argue it would mitigate long-standing inequalities. Critics, however, warn that the proposed measures are ambiguous and could inadvertently harm the very groups they aim to protect.", q: [{ q: "Аргумент сторонников?", o: ["Увеличить налоги", "Смягчить неравенство", "Закрыть школы", "Сократить бюджет"], a: 1 }, { q: "Опасение критиков?", o: ["Слишком дорого", "Неоднозначные меры", "Слишком просто", "Нет данных"], a: 1 }] }
      ],
      reading: [
        { t: "Академический текст", p: "A coherent argument requires not only empirical evidence but also a clear delineation of assumptions. Underscoring these nuances, the author advocates a pragmatic approach.", q: [{ q: "Что требуется помимо данных?", o: ["Мнение", "Ясное очерчивание допущений", "Эмоции", "Скорость"], a: 1 }, { q: "Какой подход предлагают?", o: ["Радикальный", "Прагматичный", "Теоретический", "Спорный"], a: 1 }] }
      ],
      speaking: [
        { t: "Абстрактная дискуссия", prompt: "To what extent should governments regulate emerging technologies?", points: ["risks and benefits", "ethical concerns", "role of the state", "your conclusion"] }
      ],
      quiz: [
        { t: "Практика 1", q: [{ q: "«смягчать»:", o: ["mitigate", "advocate", "underscore", "delineate"], a: 0 }, { q: "«двусмысленный»:", o: ["coherent", "ambiguous", "empirical", "valid"], a: 1 }, { q: "«в долгосрочной перспективе»:", o: ["on the whole", "in the long run", "to some extent", "get the gist"], a: 1 }, { q: "«обосновывать»:", o: ["substantiate", "touch on", "cut corners", "bear in mind"], a: 0 }] }
      ]
    }
  };

  /* ---------- ДОПОЛНИТЕЛЬНЫЙ КОНТЕНТ (lexy-course-extra.js) ---------- */
  if (w.LEXY_COURSE_EXTRA) {
    Object.keys(w.LEXY_COURSE_EXTRA).forEach(function (lv) {
      var ex = w.LEXY_COURSE_EXTRA[lv], b = BANK[lv];
      if (!b || !ex) return;
      Object.keys(ex).forEach(function (sk) { if (b[sk] && ex[sk]) b[sk] = b[sk].concat(ex[sk]); });
    });
  }

  /* ---------- СБОРКА ДНЯ ---------- */
  function isTestDay(day) { return day % 7 === 0; }

  function plan(level, day) {
    var bank = BANK[level] || BANK.A1;
    var g = GRAMMAR[level] || GRAMMAR.A1;
    var idx = day;
    function pickSkill(skill, off) { var arr = bank[skill] || bank.vocab; return arr[(idx * 2 + off) % arr.length]; }
    if (isTestDay(day)) {
      return {
        level: level, day: day, isTest: true, title: "Тест уровня · день " + day,
        blocks: [{ type: "theory", data: g[(day - 1) % g.length] }, { type: "test", data: testFor(level, day) }]
      };
    }
    var blocks = [
      { type: "theory", data: g[(day - 1) % g.length] },
      { type: "vocab", data: pickSkill("vocab", 1) },
      { type: "listening", data: pickSkill("listening", 2) },
      { type: "reading", data: pickSkill("reading", 3) },
      { type: "quiz", data: pickSkill("quiz", 4) }
    ];
    return { level: level, day: day, isTest: false, title: "День " + day + " · " + level, blocks: blocks };
  }

  function testFor(level, day) {
    var bank = BANK[level] || BANK.A1;
    var q = [];
    // собираем вопросы из quiz-банка уровня
    for (var i = 0; i < bank.quiz.length; i++) {
      for (var j = 0; j < bank.quiz[i].q.length; j++) q.push(bank.quiz[i].q[j]);
    }
    // берём по кругу набор для этого теста
    var count = 8;
    var out = [];
    for (var k = 0; k < count; k++) out.push(q[(day + k) % q.length]);
    return { title: "Тест уровня " + level + " · день " + day, questions: out };
  }

  function hash(s) { var h = 5381; s = String(s); for (var i = 0; i < s.length; i++) { h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; } return h.toString(16); }
  function audioFor(text) { return "audio/" + hash(text) + ".wav"; }

  function totalDays() { return DAYS; }
  function freeDays() { return FREE_DAYS; }
  function blockLabel(t) { return BLOCK_LABEL[t] || t; }

  w.LexyCourse = {
    LEVELS: LEVELS, GOALS: GOALS, LEVEL_TITLE: LEVEL_TITLE, DAYS: DAYS, FREE_DAYS: FREE_DAYS, BLOCKS: BLOCKS,
    bank: function (level) { return BANK[level] || BANK.A1; },
    plan: plan,
    audioFor: audioFor,
    hash: hash,
    isTestDay: isTestDay,
    totalDays: totalDays,
    freeDays: freeDays,
    blockLabel: blockLabel,
    isFree: function (level, day, premium, startLevel) {
      if (premium) return true;
      // бесплатны только первые FREE_DAYS дней вводного уровня
      var first = startLevel || "A1";
      return level === first && day <= FREE_DAYS;
    }
  };
})(window);
