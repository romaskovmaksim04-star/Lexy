/* ==========================================================
   lexy-course-extra.js — дополнительные задания курса
   (мержится в банк lexy-course.js: больше разнообразия дней)
   ========================================================== */
(function (w) {
  "use strict";
  w.LEXY_COURSE_EXTRA = {
    A1: {
      vocab: [
        { t: "Животные", w: [["dog", "собака"], ["cat", "кошка"], ["bird", "птица"], ["fish", "рыба"], ["horse", "лошадь"], ["cow", "корова"], ["rabbit", "кролик"], ["mouse", "мышь"]] },
        { t: "Одежда", w: [["shirt", "рубашка"], ["shoes", "обувь"], ["hat", "шляпа"], ["coat", "пальто"], ["dress", "платье"], ["trousers", "брюки"], ["socks", "носки"], ["jacket", "куртка"]] },
        { t: "Тело", w: [["eye", "глаз"], ["ear", "ухо"], ["nose", "нос"], ["mouth", "рот"], ["arm", "рука (от плеча)"], ["leg", "нога"], ["foot", "ступня"], ["hair", "волосы"]] },
        { t: "Погода (простые)", w: [["sun", "солнце"], ["rain", "дождь"], ["snow", "снег"], ["wind", "ветер"], ["hot", "жарко"], ["cold", "холодно"], ["cloud", "облако"], ["sky", "небо"]] },
        { t: "Транспорт", w: [["bus", "автобус"], ["train", "поезд"], ["plane", "самолёт"], ["bike", "велосипед"], ["taxi", "такси"], ["boat", "лодка"], ["ticket", "билет"], ["station", "станция"]] },
        { t: "Школа", w: [["teacher", "учитель"], ["student", "студент"], ["lesson", "урок"], ["pen", "ручка"], ["pencil", "карандаш"], ["paper", "бумага"], ["class", "класс"], ["bag", "сумка"]] },
        { t: "Дни недели", w: [["Monday", "понедельник"], ["Tuesday", "вторник"], ["Wednesday", "среда"], ["Thursday", "четверг"], ["Friday", "пятница"], ["Saturday", "суббота"], ["Sunday", "воскресенье"], ["weekend", "выходные"]] },
        { t: "Действия", w: [["open", "открывать"], ["close", "закрывать"], ["start", "начинать"], ["finish", "заканчивать"], ["look", "смотреть"], ["take", "брать"], ["give", "давать"], ["put", "класть"]] },
        { t: "Мебель", w: [["sofa", "диван"], ["lamp", "лампа"], ["clock", "часы"], ["picture", "картина"], ["mirror", "зеркало"], ["carpet", "ковёр"], ["shelf", "полка"], ["key", "ключ"]] },
        { t: "Профессии", w: [["doctor", "врач"], ["driver", "водитель"], ["cook", "повар"], ["seller", "продавец"], ["farmer", "фермер"], ["police", "полиция"], ["nurse", "медсестра"], ["cleaner", "уборщик"]] }
      ],
      listening: [
        { t: "В школе", script: "Hello, I am Sam. I am ten years old. I go to school every day. My favourite lesson is English. After school I play with my dog in the park.", q: [{ q: "Любимый урок Сэма?", o: ["Математика", "Английский", "Спорт", "Музыка"], a: 1 }, { q: "Что он делает после школы?", o: ["Читает", "Играет с собакой", "Спит", "Готовит"], a: 1 }] },
        { t: "Одежда", script: "Look at my new jacket. It is blue and very warm. I bought it yesterday, and it was on sale. Today I wear it with my black shoes.", q: [{ q: "Какого цвета куртка?", o: ["Чёрная", "Синяя", "Белая", "Красная"], a: 1 }, { q: "Когда купили?", o: ["Сегодня", "Вчера", "В прошлом году", "Завтра"], a: 1 }] },
        { t: "Погода", script: "It is very cold today. There is snow outside, so take a coat and a hat. It will be warmer tomorrow.", q: [{ q: "Какая погода?", o: ["Жарко", "Холодно", "Дождливо", "Ветрено"], a: 1 }, { q: "Что взять?", o: ["Зонт", "Куртку и шапку", "Очки", "Перчатки"], a: 1 }] },
        { t: "Автобус", script: "Excuse me, does this bus go to the station? Yes, it does. It leaves in five minutes. You can buy a ticket from the driver.", q: [{ q: "Куда едет автобус?", o: ["В аэропорт", "На станцию", "В парк", "Домой"], a: 1 }, { q: "Где купить билет?", o: ["В автомате", "У водителя", "Онлайн", "Нигде"], a: 1 }] },
        { t: "Дни", script: "On Monday I work. On Tuesday I study. On Wednesday I go to the gym. My favourite day is Friday, because the weekend starts.", q: [{ q: "Что в среду?", o: ["Работа", "Спортзал", "Учёба", "Отдых"], a: 1 }, { q: "Любимый день?", o: ["Понедельник", "Среда", "Пятница", "Суббота"], a: 2 }] },
        { t: "В парке", script: "There are many people in the park today. Two children play near the tree, and an old man reads a book on the bench. The birds sing in the sky.", q: [{ q: "Где играют дети?", o: ["У дома", "У дерева", "У фонтана", "У школы"], a: 1 }, { q: "Что делает старик?", o: ["Спит", "Читает книгу", "Гуляет", "Играет"], a: 1 }] },
        { t: "Комната", script: "In my room there is a small bed and a big window. On the shelf I keep my books and a clock. My cat likes to sleep on the sofa.", q: [{ q: "Что стоит на полке?", o: ["Лампа", "Книги и часы", "Картина", "Сумка"], a: 1 }, { q: "Где спит кошка?", o: ["На кровати", "На диване", "На столе", "На окне"], a: 1 }] },
        { t: "Магазин одежды", script: "Good morning. Can I help you? I am looking for a shirt. What size? Medium, please. Here is a nice white shirt. It is fifteen pounds.", q: [{ q: "Что ищет покупатель?", o: ["Брюки", "Рубашку", "Куртку", "Обувь"], a: 1 }, { q: "Сколько стоит?", o: ["£5", "£15", "£50", "£25"], a: 1 }] },
        { t: "Завтрак", script: "For breakfast I usually have an egg, some bread and a glass of milk. I do not drink coffee in the morning. I drink tea in the afternoon.", q: [{ q: "Что на завтрак?", o: ["Только чай", "Яйцо, хлеб, молоко", "Кофе", "Суп"], a: 1 }, { q: "Что пьёт утром?", o: ["Кофе", "Молоко", "Сок", "Воду"], a: 1 }] },
        { t: "Профессия", script: "My mother is a nurse. She works at the hospital and helps the doctor. She finishes work at seven in the evening and comes home by bus.", q: [{ q: "Кто мама по профессии?", o: ["Врач", "Медсестра", "Учитель", "Повар"], a: 1 }, { q: "Когда заканчивает работу?", o: ["В 5", "В 6", "В 7", "В 8"], a: 2 }] }
      ],
      reading: [
        { t: "Can (умение)", p: "I can ride a bike. She can cook well. We can help you today. Can you swim?", q: [{ q: "«Она умеет готовить»:", o: ["She can cook", "She can to cook", "She cans cook", "She can cooking"], a: 0 }, { q: "Вопрос «Ты умеешь плавать?»:", o: ["You can swim?", "Can you swim?", "Can swim you?", "You swim can?"], a: 1 }] },
        { t: "Множественное число 2", p: "one man — two men. one woman — two women. one foot — two feet. one child — two children.", q: [{ q: "Множественное «woman»:", o: ["womans", "women", "womes", "woman"], a: 1 }, { q: "Множественное «foot»:", o: ["foots", "feets", "feet", "footes"], a: 2 }] },
        { t: "Have got", p: "I have got a dog. She has got two cats. We have got a car. Have you got a phone?", q: [{ q: "«У неё есть две кошки»:", o: ["She have got", "She has got", "She got has", "She is got"], a: 1 }] },
        { t: "Настоящее простое: вопросы", p: "Do you like tea? Does she work here? Do they play? Where do you live?", q: [{ q: "Вопрос к «She works here»:", o: ["Does she work here?", "Do she work here?", "She works here?", "Is she work here?"], a: 0 }] },
        { t: "This / These", p: "This is a book. These are books. This bag is new. These shoes are old.", q: [{ q: "«Эти книги»:", o: ["This books", "These books", "This book", "The this books"], a: 1 }] },
        { t: "Указатели времени", p: "I get up at seven. She sleeps at night. We eat at noon. He works in the morning.", q: [{ q: "«В семь»:", o: ["on seven", "at seven", "in seven", "to seven"], a: 1 }, { q: "«Утром»:", o: ["on the morning", "in the morning", "at morning", "the morning"], a: 1 }] },
        { t: "Прилагательные", p: "A big house. A small cat. A good film. A bad day.", q: [{ q: "Правильный порядок:", o: ["house big", "big house", "a house big", "big a house"], a: 1 }] },
        { t: "Like + -ing", p: "I like swimming. She likes reading. We like playing football.", q: [{ q: "«Она любит читать»:", o: ["She likes read", "She likes reading", "She like reading", "She liking read"], a: 1 }] },
        { t: "There is / are 2", p: "There is a cat on the sofa. There are many books on the shelf. Is there a bank near here?", q: [{ q: "«Много книг на полке»:", o: ["There is many books", "There are many books", "There many books", "It many books"], a: 1 }] },
        { t: "Отрицание don't / doesn't", p: "I do not like coffee. She does not work here. We do not have a car.", q: [{ q: "«Он не работает»:", o: ["He not work", "He don't work", "He doesn't work", "He no work"], a: 2 }] }
      ],
      quiz: [
        { t: "Практика 7", q: [{ q: "Она умеет готовить:", o: ["She can cook", "She can to cook", "She cans cook", "She can cooking"], a: 0 }, { q: "Множественное «child»:", o: ["childs", "children", "childes", "child"], a: 1 }, { q: "«У меня есть собака»:", o: ["I have got a dog", "I has got a dog", "I got have dog", "I am got dog"], a: 0 }, { q: "«Эти книги»:", o: ["This books", "These books", "This book", "Those book"], a: 1 }] },
        { t: "Практика 8", q: [{ q: "Вопрос от «She works here»:", o: ["Does she work here?", "Do she work here?", "She works here?", "Is she works?"], a: 0 }, { q: "«Утром»:", o: ["on the morning", "in the morning", "at morning", "a morning"], a: 1 }, { q: "«Он не работает»:", o: ["He not work", "He don't work", "He doesn't work", "He no work"], a: 2 }, { q: "«Она любит читать»:", o: ["She likes read", "She likes reading", "She like reading", "She read likes"], a: 1 }] },
        { t: "Практика 9", q: [{ q: "Множественное «foot»:", o: ["foots", "feet", "footes", "feets"], a: 1 }, { q: "«Большой дом»:", o: ["house big", "big house", "a house big", "big a house"], a: 1 }, { q: "«У неё две кошки»:", o: ["She have got", "She has got", "She got has", "She is got"], a: 1 }, { q: "«Я пью чай в 5»:", o: ["at five", "on five", "in five", "to five"], a: 0 }] },
        { t: "Практика 10", q: [{ q: "«Ты умеешь плавать?»:", o: ["You can swim?", "Can you swim?", "Can swim you?", "Swim can you?"], a: 1 }, { q: "«Много книг на полке»:", o: ["There is many books", "There are many books", "There many books", "It is many book"], a: 1 }, { q: "Множественное «man»:", o: ["mans", "men", "manes", "menes"], a: 1 }, { q: "«Я не люблю кофе»:", o: ["I not like coffee", "I don't like coffee", "I doesn't like coffee", "I no like coffee"], a: 1 }] }
      ]
    },
    A2: {
      vocab: [
        { t: "Характер", w: [["kind", "добрый"], ["friendly", "дружелюбный"], ["polite", "вежливый"], ["honest", "честный"], ["patient", "терпеливый"], ["generous", "щедрый"], ["quiet", "спокойный"], ["confident", "уверенный"]] },
        { t: "Внешность", w: [["tall", "высокий"], ["short", "низкий"], ["slim", "стройный"], ["curly", "кудрявый"], ["straight", "прямой"], ["beard", "борода"], ["glasses", "очки"], ["smile", "улыбка"]] },
        { t: "Работа", w: [["engineer", "инженер"], ["lawyer", "юрист"], ["manager", "менеджер"], ["designer", "дизайнер"], ["scientist", "учёный"], ["journalist", "журналист"], ["salary", "зарплата"], ["interview", "собеседование"]] },
        { t: "Еда и ресторан", w: [["menu", "меню"], ["order", "заказ"], ["bill", "счёт"], ["waiter", "официант"], ["dessert", "десерт"], ["vegetable", "овощ"], ["delicious", "вкусный"], ["tip", "чаевые"]] },
        { t: "Дом и быт", w: [["neighbour", "сосед"], ["rent", "аренда"], ["furniture", "мебель"], ["lamp", "лампа"], ["curtain", "штора"], ["flat", "квартира"], ["balcony", "балкон"], ["comfortable", "удобный"]] },
        { t: "Погода и природа 2", w: [["storm", "гроза"], ["fog", "туман"], ["heat", "жара"], ["flood", "наводнение"], ["beach", "пляж"], ["island", "остров"], ["mountain", "гора"], ["valley", "долина"]] },
        { t: "Здоровье и спорт", w: [["injury", "травма"], ["recover", "выздоравливать"], ["diet", "диета"], ["gym", "спортзал"], ["coach", "тренер"], ["team", "команда"], ["match", "матч"], ["improve", "улучшать"]] },
        { t: "Путешествия 2", w: [["abroad", "за границей"], ["souvenir", "сувенир"], ["delay", "задержка"], ["booking", "бронирование"], ["guide", "гид"], ["view", "вид"], ["crowded", "людный"], ["nearby", "поблизости"]] }
      ],
      listening: [
        { t: "Аренда квартиры", script: "The flat has one bedroom, a living room and a small kitchen. The rent is six hundred a month, and the deposit is two months. It is close to the metro.", q: [{ q: "Сколько спален?", o: ["Одна", "Две", "Три", "Нет"], a: 0 }, { q: "Чему равен депозит?", o: ["Месяц", "Два месяца", "Полгода", "Нет"], a: 1 }] },
        { t: "На собеседовании", script: "Can you tell me about your last job? I worked as a manager for two years. I led a small team and improved our sales by twenty per cent.", q: [{ q: "Кем работал?", o: ["Инженером", "Менеджером", "Юристом", "Дизайнером"], a: 1 }, { q: "На сколько вырос объём продаж?", o: ["10%", "20%", "30%", "5%"], a: 1 }] },
        { t: "В ресторане 2", script: "Good evening. Are you ready to order? Yes, I would like the soup and the fish, please. And for dessert, chocolate cake. Anything to drink? Just water, please.", q: [{ q: "Что заказали на основное?", o: ["Суп и рыбу", "Стейк", "Пиццу", "Салат"], a: 0 }, { q: "Что пьют?", o: ["Вино", "Воду", "Сок", "Кофе"], a: 1 }] },
        { t: "Туристический тур", script: "The tour starts at nine at the hotel. We will visit the old castle first, then the museum. You will have two hours of free time for shopping.", q: [{ q: "Где начало тура?", o: ["В музее", "В отеле", "В замке", "На вокзале"], a: 1 }, { q: "Сколько свободного времени?", o: ["1 час", "2 часа", "3 часа", "Не будет"], a: 1 }] },
        { t: "О погоде (прогноз)", script: "Tomorrow will be cloudy with some rain in the morning. In the afternoon it will become warmer and the sun will come out. Take an umbrella just in case.", q: [{ q: "Какая погода утром?", o: ["Солнечно", "Облачно с дождём", "Снег", "Жара"], a: 1 }, { q: "Что взять?", o: ["Очки", "Зонт", "Перчатки", "Шапку"], a: 1 }] },
        { t: "Здоровье", script: "I have a headache and I feel tired. You should rest and drink more water. If it does not get better in two days, come back.", q: [{ q: "На что жалуется пациент?", o: ["На кашель", "На головную боль", "На живот", "На зуб"], a: 1 }, { q: "Что советует врач?", o: ["Работать", "Отдохнуть и пить воду", "Спорт", "Больше есть"], a: 1 }] },
        { t: "В аэропорту 2", script: "Your flight is delayed by one hour. The new departure time is six fifteen. Please listen for the gate number, it will be announced later.", q: [{ q: "На сколько задержка?", o: ["30 мин", "1 час", "2 часа", "3 часа"], a: 1 }, { q: "Новое время вылета?", o: ["5:15", "6:15", "7:15", "6:00"], a: 1 }] },
        { t: "Покупка билета", script: "Two tickets for the evening show, please. That will be twenty pounds. Would you like seats in the front or at the back? The front, please.", q: [{ q: "Сколько билетов?", o: ["Один", "Два", "Три", "Четыре"], a: 1 }, { q: "Какие места хотят?", o: ["Сзади", "Спереди", "Сбоку", "На балконе"], a: 1 }] }
      ],
      reading: [
        { t: "Past Continuous", p: "I was reading when she called. They were playing at eight. What were you doing at noon?", q: [{ q: "Верно:", o: ["I was read", "I was reading", "I were reading", "I reading was"], a: 1 }] },
        { t: "Used to", p: "I used to live in London. She used to play the piano. We used to go there every summer.", q: [{ q: "«Раньше жил»:", o: ["I use to live", "I used to live", "I was used live", "I used live to"], a: 1 }] },
        { t: "Some / any", p: "I have some friends here. Do you have any questions? We don't have any milk.", q: [{ q: "В вопросе обычно:", o: ["some", "any", "a", "the"], a: 1 }] },
        { t: "Too / enough", p: "This coffee is too hot. The bag is big enough. He is too tired to work.", q: [{ q: "«Слишком горячий»:", o: ["enough hot", "too hot", "hot too", "very enough"], a: 1 }] },
        { t: "First conditional", p: "If you study, you will pass. If it rains, we will stay home.", q: [{ q: "Верно:", o: ["If you study, you pass", "If you study, you will pass", "If you will study, you pass", "If study, pass"], a: 1 }] },
        { t: "Who / which / where", p: "The man who called is my boss. The book which I read was great. The place where we met is nice.", q: [{ q: "«книга, которую я читал»:", o: ["who I read", "which I read", "where I read", "what I read"], a: 1 }] }
      ],
      quiz: [
        { t: "Практика 3", q: [{ q: "Верно:", o: ["I was read", "I was reading", "I were reading", "I reading"], a: 1 }, { q: "Раньше жил:", o: ["I use to live", "I used to live", "I used live to", "I live used"], a: 1 }, { q: "Вопрос:", o: ["some", "any", "a", "the"], a: 1 }, { q: "«слишком горячий»:", o: ["enough hot", "too hot", "hot too", "very hot enough"], a: 1 }] },
        { t: "Практика 4", q: [{ q: "Условное 1:", o: ["If you study, you pass", "If you study, you will pass", "If you will study, pass", "If study, pass"], a: 1 }, { q: "«книга, которую я читал»:", o: ["who I read", "which I read", "where I read", "when I read"], a: 1 }, { q: "«Раньше играл»:", o: ["used to play", "use to play", "used play", "use play"], a: 0 }, { q: "«Слишком устал, чтобы работать»:", o: ["too tired to work", "enough tired to work", "tired too work", "very tired work"], a: 0 }] }
      ]
    },
    B1: {
      vocab: [
        { t: "Абстрактные", w: [["opportunity", "возможность"], ["development", "развитие"], ["attitude", "отношение"], ["awareness", "осознанность"], ["confidence", "уверенность"], ["pressure", "давление"], ["solution", "решение"], ["challenge", "вызов"]] },
        { t: "Общество", w: [["government", "правительство"], ["citizen", "гражданин"], ["community", "сообщество"], ["public", "публика"], ["education", "образование"], ["economy", "экономика"], ["policy", "политика"], ["rights", "права"]] },
        { t: "Работа и офис", w: [["schedule", "график"], ["report", "отчёт"], ["client", "клиент"], ["budget", "бюджет"], ["task", "задача"], ["meeting", "встреча"], ["overtime", "переработка"], ["target", "цель"]] },
        { t: "Образование", w: [["university", "университет"], ["lecture", "лекция"], ["essay", "эссе"], ["scholarship", "стипендия"], ["professor", "профессор"], ["assignment", "задание"], ["grades", "оценки"], ["graduate", "выпускник"]] }
      ],
      listening: [
        { t: "Городской совет", script: "We propose to build a new bicycle lane along the river. It will reduce traffic in the centre and encourage people to be more active. The initial cost is high, but the long-term benefits are significant.", q: [{ q: "Что предлагают?", o: ["Новую дорогу", "Велодорожку", "Мост", "Парк"], a: 1 }, { q: "Аргумент за?", o: ["Меньше трафика и активность", "Больше парковок", "Больше машин", "Дешевле"], a: 0 }] },
        { t: "Университет", script: "The deadline for the essay is next Friday. You must submit it online and include a list of sources. Late submissions will lose ten per cent of the mark.", q: [{ q: "Срок эссе?", o: ["Следующая пятница", "Следующий понедельник", "Сегодня", "Через месяц"], a: 0 }, { q: "Штраф за опоздание?", o: ["Ноль", "10%", "20%", "Отчисление"], a: 1 }] },
        { t: "Работа (звонок)", script: "Hi, it's about the report. Could you send the final version by Wednesday? Also, we need to add the latest figures before the client meeting. Can you manage that?", q: [{ q: "Когда нужен отчёт?", o: ["Ко вторнику", "К среде", "К пятнице", "Сегодня"], a: 1 }, { q: "Что добавить?", o: ["Фото", "Свежие цифры", "Имена", "План"], a: 1 }] },
        { t: "Путешествие", script: "Passengers, please note that the flight to Berlin will board at Gate nine. Boarding will close fifteen minutes before departure. Have your passports ready.", q: [{ q: "Куда рейс?", o: ["В Париж", "В Берлин", "В Лондон", "В Мадрид"], a: 1 }, { q: "У каких ворот посадка?", o: ["Gate 6", "Gate 9", "Gate 12", "Gate 15"], a: 1 }] }
      ],
      reading: [
        { t: "Present Perfect Continuous", p: "I have been learning English for two years. She has been working here since May. How long have you been waiting?", q: [{ q: "«Учу английский 2 года»:", o: ["I learn English 2 years", "I have been learning English for two years", "I am learning 2 years", "I learned 2 years"], a: 1 }] },
        { t: "Wish / If only", p: "I wish I had more time. If only I could travel. She wishes she spoke French.", q: [{ q: "Сожаление о настоящем:", o: ["I wish I have time", "I wish I had time", "I wish I will have", "I wish I has"], a: 1 }] },
        { t: "Gerund vs Infinitive", p: "I enjoy reading. I want to travel. She decided to stay. We finished working.", q: [{ q: "После «enjoy»:", o: ["to read", "reading", "read", "reads"], a: 1 }, { q: "После «want»:", o: ["to travel", "traveling", "travel", "travelled"], a: 0 }] }
      ],
      quiz: [
        { t: "Практика 2", q: [{ q: "«Учу английский 2 года»:", o: ["I learn 2 years", "I have been learning for two years", "I am learning 2 years", "I learned 2 years"], a: 1 }, { q: "Сожаление:", o: ["I wish I have time", "I wish I had time", "I wish I will have", "I wish I has"], a: 1 }, { q: "После enjoy:", o: ["to read", "reading", "read", "reads"], a: 1 }, { q: "После want:", o: ["to travel", "travelling", "travel", "travelled"], a: 0 }] }
      ]
    }
  };
})(window);
