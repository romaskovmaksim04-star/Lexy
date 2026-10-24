/* ==========================================================
   lexy-content.js — банк заданий Lexi
   • READING / LISTENING / WRITING / SPEAKING / VOCAB
   • Бесплатно доступна часть (FREE), остальное — по Premium
   • Аудирование озвучивается бесплатно (Web Speech API)
   ========================================================== */
(function (w) {
  "use strict";

  var READING = [
    { t: "Городские сады", p: "Roof gardens are spreading across large cities. On the top of apartment blocks, residents grow vegetables and herbs in shallow soil. Supporters say these gardens cool buildings in summer, cut energy costs and give neighbours a reason to talk. Critics note that the soil must be light, so only small plants survive, and that watering systems are expensive to install.",
      q: [ { q: "Какова основная польза садов на крышах, по тексту?", o: ["Они делают еду бесплатной", "Они охлаждают здания и экономят энергию", "Они заменяют парки", "Они увеличивают аренду"], a: 1 },
           { q: "Почему на крышах растут только небольшие растения?", o: ["Мало света", "Почва должна быть лёгкой", "Нет ветра", "Их мало поливают"], a: 1 },
           { q: "Что критики считают проблемой?", o: ["Дорогие системы полива", "Запах", "Шум", "Много людей"], a: 0 } ] },
    { t: "Удалённая работа", p: "Since many companies allowed remote work, commuting has fallen in some cities. Employees save time and money, and firms spend less on office space. However, research suggests that new staff learn more slowly when they never meet colleagues face to face. Some employers now ask people to come in two or three days a week — a 'hybrid' plan that tries to keep the benefits of both.",
      q: [ { q: "Что выигрывают сотрудники при удалённой работе?", o: ["Больше отпуска", "Время и деньги", "Бесплатный обед", "Новую должность"], a: 1 },
           { q: "Какая проблема отмечена в тексте?", o: ["Новички учатся медленнее", "Выше налоги", "Медленнее интернет", "Больше начальников"], a: 0 },
           { q: "Что такое гибридный план?", o: ["Работа только дома", "2–3 дня в офисе", "Работа ночью", "Только выходные"], a: 1 } ] },
    { t: "Сон и память", p: "Students often study late at night before exams. Yet studies show that sleep is when the brain sorts and stores what we learned during the day. Skipping sleep to revise more can actually reduce how much you remember. Psychologists advise short reviews in the evening and a full night's rest before a test.",
      q: [ { q: "Что делает мозг во время сна?", o: ["Отдыхает полностью", "Сортирует и сохраняет информацию", "Забывает всё", "Тратит энергию"], a: 1 },
           { q: "К чему ведёт отказ от сна ради учёбы?", o: ["К лучшей памяти", "К снижению запоминания", "К скорости", "Ни к чему"], a: 1 },
           { q: "Что советуют психологи?", o: ["Учить всю ночь", "Короткое повторение вечером и сон", "Не учить вообще", "Учить утром"], a: 1 } ] },
    { t: "Переработка пластика", p: "Households are told to recycle plastic, but only a fraction of it is actually turned into new products. Much depends on whether the plastic is clean and sorted by type. Bottles are easy to recycle; mixed films and black trays are not. Experts say reducing packaging in the first place matters more than recycling symbols on the label.",
      q: [ { q: "Какая часть пластика реально перерабатывается?", o: ["Вся", "Большая часть", "Лишь небольшая доля", "Почти сто процентов"], a: 2 },
           { q: "Что легче переработать?", o: ["Чёрные лотки", "Бутылки", "Плёнку", "Смешанный пластик"], a: 1 },
           { q: "Что эксперты считают важнее?", o: ["Символы на упаковке", "Сокращение упаковки", "Больше баков", "Платить больше"], a: 1 } ] },
    { t: "Пчёлы и опыление", p: "Bees and other insects pollinate many of the crops we eat, from apples to almonds. In recent years, bee numbers have fallen in several regions. Farmers blame pesticides, disease and a lack of wild flowers. Some now plant strips of flowers beside fields and avoid chemicals in spring, when bees are most active.",
      q: [ { q: "Какую роль играют пчёлы?", o: ["Они поедают урожай", "Они опыляют культуры", "Они удобряют почву", "Они отпугивают птиц"], a: 1 },
           { q: "Какую причину НЕ называют фермеры?", o: ["Пестициды", "Болезни", "Мало диких цветов", "Слишком много дождя"], a: 3 },
           { q: "Что делают некоторые фермеры?", o: ["Сажают цветы рядом с полями", "Убирают пчёл", "Больше опрыскивают", "Меняют культуры на пластик"], a: 0 } ] },
    { t: "Приложения для языков", p: "Language apps are popular because they are cheap and easy to use anywhere. They are good for building vocabulary and daily habits. But experts warn that an app alone rarely makes someone fluent. Learners still need to speak with real people, make mistakes and receive feedback to improve pronunciation and fluency.",
      q: [ { q: "В чём сильная сторона приложений?", o: ["Они делают беглым за неделю", "Словарный запас и привычка заниматься", "Заменяют учителя", "Бесплатны всегда"], a: 1 },
           { q: "Чего не хватает при использовании только приложения?", o: ["Слов", "Живой речи и обратной связи", "Звука", "Картинок"], a: 1 },
           { q: "Что помогает улучшить произношение?", o: ["Больше тестов", "Разговоры и ошибки", "Дольше спать", "Меньше практики"], a: 1 } ] },
    { t: "Возобновляемая энергия", p: "Solar panels and wind farms now produce a growing share of electricity. Their fuel — sunlight and wind — costs nothing, and they do not release carbon while working. The challenge is that they produce power only when the sun shines or the wind blows. Storing that energy for calm, dark evenings is the main problem engineers are trying to solve.",
      q: [ { q: "Какое преимущество возобновляемой энергии?", o: ["Топливо бесплатно", "Она не требует оборудования", "Работает всегда", "Её легко хранить"], a: 0 },
           { q: "В чём главная трудность?", o: ["Высокий шум", "Производство зависит от погоды", "Много дыма", "Дорогое топливо"], a: 1 },
           { q: "Что пытаются решить инженеры?", o: ["Как хранить энергию", "Как строить реже", "Как жечь больше угля", "Как поднять цену"], a: 0 } ] },
    { t: "Бесплатные музеи", p: "Several countries made national museums free to enter. Visitor numbers rose sharply, especially among families and young people who had never visited before. Museums gained from shops and cafés, but also faced crowded rooms and higher running costs. Some introduced free tickets with a booking slot to manage the flow of people.",
      q: [ { q: "Что произошло после отмены платы?", o: ["Посетителей стало меньше", "Число посетителей резко выросло", "Музеи закрылись", "Ничего не изменилось"], a: 1 },
           { q: "Какую выгоду получили музеи?", o: ["Доход от магазинов и кафе", "Меньше расходов", "Больше сотрудников", "Дешевле ремонт"], a: 0 },
           { q: "Зачем вводят бронирование по времени?", o: ["Чтобы поднять цену", "Чтобы управлять потоком людей", "Чтобы закрыть залы", "Чтобы пустить меньше людей навсегда"], a: 1 } ] },
    { t: "История кофе", p: "Coffee is said to have been discovered in Ethiopia, where a herder noticed that his goats became lively after eating certain red berries. From there it spread to Yemen, then to Europe, where coffee houses became places to talk about ideas and trade. Today it is one of the most traded goods in the world.",
      q: [ { q: "Где, по преданию, открыли кофе?", o: ["В Йемене", "В Эфиопии", "В Европе", "В Бразилии"], a: 1 },
           { q: "Чем стали кофейни в Европе?", o: ["Спальнями", "Местами для разговоров и торговли", "Фабриками", "Школами"], a: 1 },
           { q: "Что говорят о кофе сегодня?", o: ["Его почти не продают", "Это один из самых торгуемых товаров", "Его запретили", "Его пьют только в Азии"], a: 1 } ] },
    { t: "Спорт и настроение", p: "Doctors often recommend exercise not only for the body but for the mind. Even a short walk can lift mood, because activity releases chemicals that reduce stress. Regular movement also improves sleep, which in turn helps focus. The hardest part for many people is simply starting and keeping the habit.",
      q: [ { q: "Почему прогулка поднимает настроение?", o: ["Выделяются вещества, снижающие стресс", "Становится скучно", "Растёт аппетит", "Ничего не происходит"], a: 0 },
           { q: "Как движение влияет на сон?", o: ["Ухудшает", "Улучшает", "Не влияет", "Мешает"], a: 1 },
           { q: "Что самое трудное для многих?", o: ["Купить кроссовки", "Начать и сохранить привычку", "Найти врача", "Пить воду"], a: 1 } ] },
    { t: "Космический туризм", p: "A few companies now sell short trips to the edge of space. Passengers pay large sums for a few minutes of weightlessness and a view of the curve of the Earth. Supporters say the money funds research; critics ask whether such fuel should be spent on holidays while the planet faces climate problems.",
      q: [ { q: "Что покупают космические туристы?", o: ["Дом на орбите", "Короткий полёт к границе космоса", "Билет на Луну", "Спутник"], a: 1 },
           { q: "Что говорят сторонники?", o: ["Деньги идут на исследования", "Это опасно", "Это бесплатно", "Это незаконно"], a: 0 },
           { q: "В чём сомнение критиков?", o: ["Слишком дешёво", "Топливо при климатических проблемах", "Мало желающих", "Нет технологий"], a: 1 } ] },
    { t: "Дороги Древнего Рима", p: "The Romans built thousands of kilometres of stone roads. Layers of gravel and flat stones made them strong enough to last for centuries. They allowed armies and goods to move quickly across the empire. Many modern roads still follow the same routes, a sign of how well the engineers chose the land.",
      q: [ { q: "Почему римские дороги были прочными?", o: ["Их делали из дерева", "Слои гравия и камня", "Их часто строили заново", "Их не использовали"], a: 1 },
           { q: "Зачем были нужны дороги?", o: ["Для армий и товаров", "Для туристов", "Для школ", "Для храмов"], a: 0 },
           { q: "Что говорит о хорошем выборе инженеров?", o: ["Дороги убрали", "Современные дороги идут по тем же путям", "Их забыли", "Они были короткими"], a: 1 } ] }
  ];

  var LISTENING = [
    { t: "Время тура", script: "Good morning and welcome to the city museum tour. The tour was going to start at nine, but we have changed it — it will now begin at half past nine. Please gather at the main entrance, not the side door.",
      q: [ { q: "Во сколько начинается тур?", o: ["9:00", "9:15", "9:30", "10:00"], a: 2 },
           { q: "Где собираются?", o: ["У боковой двери", "У главного входа", "В кафе", "На парковке"], a: 1 } ] },
    { t: "Встреча", script: "So Friday works for everyone. Oh, wait — actually, let's move it to Saturday morning, ten o'clock. Friday is too close to the deadline.",
      q: [ { q: "Когда встреча?", o: ["В пятницу", "В субботу утром", "В воскресенье", "В понедельник"], a: 1 },
           { q: "Во сколько?", o: ["9:00", "10:00", "11:00", "12:00"], a: 1 } ] },
    { t: "Цена", script: "The full price is forty-five pounds, but if you have a student card, you only pay thirty. Children under twelve go free.",
      q: [ { q: "Сколько платят студенты?", o: ["£45", "£30", "£15", "Бесплатно"], a: 1 },
           { q: "Кто проходит бесплатно?", o: ["Пенсионеры", "Дети до 12", "Студенты", "Все"], a: 1 } ] },
    { t: "Ворота", script: "Your flight is boarding at Gate twelve... I'm sorry, I made a mistake — Gate fourteen. Please go to Gate fourteen now.",
      q: [ { q: "В какие ворота идти?", o: ["Gate 12", "Gate 13", "Gate 14", "Gate 4"], a: 2 } ] },
    { t: "Библиотека", script: "The library is open late on weekdays, until eight. At the weekend it closes earlier, at six. On Sunday we open at ten in the morning.",
      q: [ { q: "Когда закрывается в воскресенье?", o: ["В 6", "В 7", "В 8", "В 9"], a: 0 },
           { q: "Когда открывается в воскресенье?", o: ["В 8", "В 9", "В 10", "В 11"], a: 2 } ] },
    { t: "Комната", script: "The meeting has moved. It was in Room two-oh-four, but it is now in Room two-one-oh. Please don't go to the old room.",
      q: [ { q: "Где теперь встреча?", o: ["Room 204", "Room 210", "Room 240", "Room 214"], a: 1 } ] },
    { t: "Аренда", script: "The rent is five hundred a month, and that includes water. Electricity is separate — about forty pounds, depending on use. The deposit is one month's rent.",
      q: [ { q: "Что включено в аренду?", o: ["Электричество", "Вода", "Интернет", "Мебель"], a: 1 },
           { q: "Чему равен депозит?", o: ["Половине аренды", "Одной аренде", "Двум арендам", "£40"], a: 1 } ] },
    { t: "Расписание автобуса", script: "The number ten bus runs every fifteen minutes from six in the morning until eleven at night. On Sundays it starts later, at eight.",
      q: [ { q: "Как часто ходит автобус №10?", o: ["Каждые 10 мин", "Каждые 15 мин", "Каждый час", "Каждые 30 мин"], a: 1 },
           { q: "Когда он начинает ходить в воскресенье?", o: ["В 6", "В 7", "В 8", "В 9"], a: 2 } ] },
    { t: "Курс", script: "The course lasts twelve weeks, with classes twice a week. Each class is two hours. You'll need to bring your own laptop, but the books are provided.",
      q: [ { q: "Сколько длится курс?", o: ["6 недель", "8 недель", "12 недель", "20 недель"], a: 2 },
           { q: "Что нужно принести?", o: ["Учебники", "Ноутбук", "Форму", "Планшет"], a: 1 } ] },
    { t: "Доктор", script: "I'm afraid the doctor is running late. Your appointment was at three, but she can see you at quarter past four. Please take a seat in the waiting room.",
      q: [ { q: "Когда примет врач?", o: ["В 3:00", "В 3:15", "В 4:00", "В 4:15"], a: 3 } ] },
    { t: "Скидка", script: "This jacket is normally eighty pounds, but it's in the sale at half price this week only. Next week it goes back to the full price.",
      q: [ { q: "Сколько стоит куртка сейчас?", o: ["£80", "£60", "£40", "£20"], a: 2 } ] },
    { t: "Погода и поезд", script: "All trains to the north are delayed because of heavy snow. The nine-forty service will leave at ten twenty. Passengers for Leeds should wait on platform three.",
      q: [ { q: "Когда уйдёт поезд 9:40?", o: ["9:40", "10:00", "10:20", "11:20"], a: 2 },
           { q: "На какой платформе ждать пассажирам до Лидса?", o: ["1", "2", "3", "4"], a: 2 } ] }
  ];

  var WRITING = [
    { prompt: "Some people think that technology has made everyday life more complicated, while others believe it has made life simpler. Discuss both views and give your own opinion.", min: 250 },
    { prompt: "Many cities are investing in public transport instead of building new roads. Do the advantages of this approach outweigh the disadvantages?", min: 250 },
    { prompt: "Some believe that children should start learning a foreign language at primary school rather than secondary school. Do you agree or disagree?", min: 250 },
    { prompt: "In many countries, people are living longer than before. What problems does this create for society, and what solutions can you suggest?", min: 250 },
    { prompt: "Some people prefer to work for a large company, while others prefer to run their own business. Discuss both views and give your opinion.", min: 250 },
    { prompt: "Governments should spend more money on the arts (music, theatre, painting) than on sport. To what extent do you agree or disagree?", min: 250 },
    { prompt: "Online shopping is replacing physical shops in many places. Is this a positive or a negative development?", min: 250 },
    { prompt: "Some say that university education should be free for everyone. Others argue students should pay. Discuss both views and give your opinion.", min: 250 }
  ];

  var SPEAKING = [
    { part: "Part 2", prompt: "Describe a place you love visiting.", points: ["where it is", "how often you go there", "what you usually do there", "why you love this place"] },
    { part: "Part 2", prompt: "Describe a person who has influenced you.", points: ["who they are", "how you know them", "what they did", "why they influenced you"] },
    { part: "Part 2", prompt: "Describe an important skill you have learned.", points: ["what the skill is", "when you learned it", "how you learned it", "why it is important"] },
    { part: "Part 2", prompt: "Describe a memorable journey you have taken.", points: ["where you went", "who you were with", "what happened", "why it was memorable"] },
    { part: "Part 2", prompt: "Describe a piece of technology you find useful.", points: ["what it is", "how you use it", "how long you have had it", "why it is useful"] },
    { part: "Part 2", prompt: "Describe a festival or celebration you enjoy.", points: ["what it is", "when it happens", "who you celebrate with", "why you enjoy it"] },
    { part: "Part 2", prompt: "Describe a book or film that changed your thinking.", points: ["what it was", "when you read or watched it", "what it was about", "how it changed your thinking"] },
    { part: "Part 2", prompt: "Describe a goal you would like to achieve.", points: ["what the goal is", "why you chose it", "how you plan to achieve it", "how you will feel when you do"] }
  ];

  var VOCAB = [
    { title: "Academic Word List · 1", words: [["analyse", "анализировать"], ["approach", "подход"], ["assess", "оценивать"], ["benefit", "польза"], ["concept", "концепция"], ["consist", "состоять"], ["constant", "постоянный"], ["context", "контекст"], ["create", "создавать"], ["define", "определять"]] },
    { title: "Academic Word List · 2", words: [["derive", "выводить, происходить"], ["distribute", "распределять"], ["estimate", "оценивать"], ["evident", "очевидный"], ["factor", "фактор"], ["feature", "особенность"], ["final", "итоговый"], ["focus", "фокус"], ["impact", "влияние"], ["indicate", "указывать"]] },
    { title: "Academic Word List · 3", words: [["interpret", "интерпретировать"], ["involve", "включать"], ["issue", "вопрос, проблема"], ["labour", "труд"], ["legal", "законный"], ["major", "основной"], ["method", "метод"], ["occur", "происходить"], ["percent", "процент"], ["period", "период"]] },
    { title: "Слова-связки для Writing", words: [["however", "однако"], ["therefore", "следовательно"], ["moreover", "более того"], ["furthermore", "к тому же"], ["nevertheless", "тем не менее"], ["consequently", "в результате"], ["initially", "первоначально"], ["overall", "в целом"], ["specifically", "в частности"], ["likewise", "аналогично"]] },
    { title: "Фразовые глаголы", words: [["carry out", "выполнять"], ["point out", "указывать"], ["figure out", "понимать, разбираться"], ["come up with", "придумывать"], ["put off", "откладывать"], ["bring about", "вызывать"], ["look into", "изучать"], ["set up", "основывать"], ["turn out", "оказываться"], ["work out", "решать, тренироваться"]] },
    { title: "Темы Speaking", words: [["environment", "окружающая среда"], ["education", "образование"], ["technology", "технологии"], ["culture", "культура"], ["health", "здоровье"], ["society", "общество"], ["career", "карьера"], ["tourism", "туризм"], ["media", "медиа"], ["tradition", "традиция"]] }
  ];

  var FREE = { reading: 4, listening: 4, writing: 2, speaking: 2, vocab: 2 };

  function hash(s) { var h = 5381; s = String(s); for (var i = 0; i < s.length; i++) { h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; } return h.toString(16); }
  function audioFor(text) { return "audio/" + hash(text) + ".wav"; }

  var BANK = { reading: READING, listening: LISTENING, writing: WRITING, speaking: SPEAKING, vocab: VOCAB };

  w.LexyContent = {
    FREE: FREE,
    bank: function (skill) { return BANK[skill] || []; },
    count: function (skill) { return (BANK[skill] || []).length; },
    item: function (skill, n) { var b = BANK[skill] || []; return b[(n - 1) % b.length]; },
    freeLimit: function (skill) { return FREE[skill] || 0; },
    isLocked: function (skill, n, premium) { return !premium && n > (FREE[skill] || 0); },
    hash: hash,
    audioFor: audioFor
  };
})(window);
