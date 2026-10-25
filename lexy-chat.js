/* ==========================================================
   lexy-chat.js — Lexi AI (Разговор): чат-практика + письмо
   • AI через Supabase Edge Function ai-chat
   • Уровень из курса; IELTS-письмо или общая практика письма
   • Инструкции, анимации, «печатает…», сохранение чата
   ========================================================== */
(function (w) {
  "use strict";
  var cfg = w.LEXY_SUPABASE || {};
  var base = String(cfg.url || "").replace(/\/+$/, "");

  function call(body) {
    return w.LexyAuth.token().then(function (t) {
      if (!t) throw { code: "auth" };
      return fetch(base + "/functions/v1/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + t, "apikey": cfg.anonKey || "" },
        body: JSON.stringify(body),
      }).then(function (r) {
        return r.text().then(function (tx) {
          var d = null; try { d = tx ? JSON.parse(tx) : null; } catch (e) {}
          if (!r.ok) throw { code: (d && d.error) || "http", status: r.status, limit: d && d.limit };
          return d;
        });
      });
    });
  }

  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ic(n) { return w.Lexy.ic(n); }
  function flame(h) { try { return w.Lexy.fl(h); } catch (e) { return ""; } }
  function toast(t) { try { w.Lexy.toast(t); } catch (e) {} }

  /* ---------- локализация (RU/EN/KZ/UZ) ---------- */
  var TX = {
    ru: {
      heroExam: "Практика разговора и IELTS Writing", heroGen: "Практика разговора и письма", lvl: "уровень",
      bot: "🤖 ИИ-собеседник", bExam: "IELTS-проверка", bGen: "Общая проверка",
      tabChat: "💬 Чат", tabWrite: "✍️ Письмо",
      lockBody: "Живой чат-практика английского и проверка письма с ИИ — на тарифе Premium.",
      getPrem: "Получить Premium", online: "онлайн", typing: "печатает…",
      phInput: "Напиши по-английски…", ariaSend: "Отправить", hintEnter: "Enter — отправить · Shift+Enter — новая строка", reset: "Сбросить чат",
      emptyHi: "Привет! Я Lexi 👋", emptySub: "Напиши что-нибудь по-английски — и начнём беседу.",
      chatInfo: '<div class="lxa-info"><b>Как работает чат</b><ol><li>Пиши по-английски на любую тему — об учёбе, планах, хобби.</li><li>Lexi отвечает по твоему уровню и мягко исправляет ошибки.</li><li>Каждый ответ — с вопросом, чтобы беседа продолжалась.</li></ol><div class="ex"><i>Пример:</i><br>— Hi! What did you do at the weekend?<br>— I go to cinema with friends.<br>— Nice! <i>I went</i> to the cinema with friends — that sounds fun. What film did you watch?</div></div>',
      okT: "✓ Написано верно", badT: "⚠ Есть, что поправить", fixedL: "Исправлено:",
      needPrem: "Нужен Premium", chatLimit: "Дневной лимит чата исчерпан", chatFail: "Не удалось ответить, попробуй ещё",
      resetQ: "Сбросить чат?", resetQBody: "Вся история беседы удалится. Начать заново?", resetOk: "Сбросить", cancel: "Отмена", chatCleared: "Чат очищен",
      writeGen: "Практика письма",
      writeInfoExam: '<div class="lxa-info"><b>Как проходит проверка IELTS Writing</b><ol><li>Нажми «Получить тему» — ИИ-экзаменатор выдаст вопрос Task 2.</li><li>Напиши эссе (250+ слов).</li><li>Нажми «Проверить» — ИИ оценит по критериям IELTS и даст балл + разбор.</li></ol><div class="ex"><i>Структура эссе:</i><br>1) Введение — перефраз темы + твоя позиция.<br>2) Абзац 1 — аргумент + пример.<br>3) Абзац 2 — второй аргумент + пример.<br>4) Заключение — вывод.<br><br><i>Связки:</i> however, therefore, moreover, for example, in conclusion.</div></div>',
      writeInfoGen: '<div class="lxa-info"><b>Как проходит практика письма</b><ol><li>Нажми «Получить задание» — Lexi даст короткую тему (абзац, письмо или заметка).</li><li>Напиши текст на английском.</li><li>Нажми «Проверить» — Lexi оценит уровень (A1–C1) и подскажет, что улучшить.</li></ol><div class="ex"><i>Пример задания:</i> Write a short email to a friend about your weekend.<br><br><i>Шаблон:</i><br>Hi {name}, …<br>— основная часть: что, где, когда.<br>Best, {твоё имя}.</div></div>',
      topicL: "Тема:", phEssay: "Напиши текст здесь…", wordsL: "Слов:", minW: "минимум 250", moreW: "чем больше, тем лучше", otherTopic: "Другая тема", checkBtn: "Проверить",
      getTopicExam: "Получить тему", getTopicGen: "Получить задание",
      bandExam: "Оценка IELTS", bandGen: "Примерный уровень", strengths: "Сильные стороны", improve: "Что улучшить", notes: "Замечания",
      picking: "Подбираем…", topicReady: "Тема готова · осталось тем сегодня: ", topicLimit: "Дневной лимит тем исчерпан", topicFail: "Не удалось получить тему",
      writeShort: "Напиши хотя бы немного текста", checking: "Проверяем…", checkDone: "Готово", checkDoneN: "Готово · проверок осталось сегодня: ", checkLimit: "Лимит проверок на сегодня исчерпан", checkFail: "Не удалось проверить, попробуй ещё",
      stepsExam: ["Читаем тему и эссе", "Считаем слова и структуру", "Оцениваем по критериям IELTS", "Составляем разбор"],
      stepsGen: ["Читаем текст", "Проверяем грамматику и слова", "Определяем уровень", "Собираем советы"]
    },
    en: {
      heroExam: "Conversation practice and IELTS Writing", heroGen: "Conversation and writing practice", lvl: "level",
      bot: "🤖 AI partner", bExam: "IELTS check", bGen: "General check",
      tabChat: "💬 Chat", tabWrite: "✍️ Writing",
      lockBody: "Live English chat practice and AI essay checking — on the Premium plan.",
      getPrem: "Get Premium", online: "online", typing: "typing…",
      phInput: "Write in English…", ariaSend: "Send", hintEnter: "Enter — send · Shift+Enter — new line", reset: "Reset chat",
      emptyHi: "Hi! I'm Lexi 👋", emptySub: "Write something in English and let's start chatting.",
      chatInfo: '<div class="lxa-info"><b>How the chat works</b><ol><li>Write in English on any topic — study, plans, hobbies.</li><li>Lexi replies at your level and gently fixes mistakes.</li><li>Every reply ends with a question so the talk keeps going.</li></ol><div class="ex"><i>Example:</i><br>— Hi! What did you do at the weekend?<br>— I go to cinema with friends.<br>— Nice! <i>I went</i> to the cinema with friends — that sounds fun. What film did you watch?</div></div>',
      okT: "✓ Written correctly", badT: "⚠ Something to fix", fixedL: "Fixed:",
      needPrem: "Premium required", chatLimit: "Daily chat limit reached", chatFail: "Couldn't reply, try again",
      resetQ: "Reset chat?", resetQBody: "The whole conversation will be deleted. Start over?", resetOk: "Reset", cancel: "Cancel", chatCleared: "Chat cleared",
      writeGen: "Writing practice",
      writeInfoExam: '<div class="lxa-info"><b>How IELTS Writing checking works</b><ol><li>Tap “Get a topic” — the AI examiner gives a Task 2 question.</li><li>Write your essay (250+ words).</li><li>Tap “Check” — the AI scores it against IELTS criteria and gives feedback.</li></ol><div class="ex"><i>Essay structure:</i><br>1) Intro — paraphrase the task + your position.<br>2) Body 1 — argument + example.<br>3) Body 2 — second argument + example.<br>4) Conclusion — summary.<br><br><i>Linkers:</i> however, therefore, moreover, for example, in conclusion.</div></div>',
      writeInfoGen: '<div class="lxa-info"><b>How writing practice works</b><ol><li>Tap “Get a task” — Lexi gives a short topic (a paragraph, email or note).</li><li>Write your text in English.</li><li>Tap “Check” — Lexi rates your level (A1–C1) and suggests improvements.</li></ol><div class="ex"><i>Example task:</i> Write a short email to a friend about your weekend.<br><br><i>Template:</i><br>Hi {name}, …<br>— main part: what, where, when.<br>Best, {your name}.</div></div>',
      topicL: "Topic:", phEssay: "Write your text here…", wordsL: "Words:", minW: "250 minimum", moreW: "the more the better", otherTopic: "Another topic", checkBtn: "Check",
      getTopicExam: "Get a topic", getTopicGen: "Get a task",
      bandExam: "IELTS score", bandGen: "Estimated level", strengths: "Strengths", improve: "What to improve", notes: "Notes",
      picking: "Picking…", topicReady: "Topic ready · topics left today: ", topicLimit: "Daily topic limit reached", topicFail: "Couldn't get a topic",
      writeShort: "Write at least a little text", checking: "Checking…", checkDone: "Done", checkDoneN: "Done · checks left today: ", checkLimit: "Daily check limit reached", checkFail: "Couldn't check, try again",
      stepsExam: ["Reading the topic and essay", "Counting words and structure", "Scoring against IELTS criteria", "Writing feedback"],
      stepsGen: ["Reading the text", "Checking grammar and vocabulary", "Estimating the level", "Gathering tips"]
    },
    kz: {
      heroExam: "Сөйлесу практикасы және IELTS Writing", heroGen: "Сөйлесу және жазу практикасы", lvl: "деңгей",
      bot: "🤖 ИИ-әңгімелесуші", bExam: "IELTS тексеру", bGen: "Жалпы тексеру",
      tabChat: "💬 Чат", tabWrite: "✍️ Жазу",
      lockBody: "Ағылшын тілінде тірі чат-практика және ИИ-мен эссе тексеру — Premium тарифінде.",
      getPrem: "Premium алу", online: "желіде", typing: "жазып жатыр…",
      phInput: "Ағылшынша жаз…", ariaSend: "Жіберу", hintEnter: "Enter — жіберу · Shift+Enter — жаңа жол", reset: "Чатты тазалау",
      emptyHi: "Сәлем! Мен Lexi 👋", emptySub: "Ағылшынша бірдеңе жазып, сөйлесуді бастайық.",
      chatInfo: '<div class="lxa-info"><b>Чат қалай жұмыс істейді</b><ol><li>Кез келген тақырыпта ағылшынша жаз — оқу, жоспар, хобби.</li><li>Lexi деңгейіңе сай жауап беріп, қателерді жұмсақ түзетеді.</li><li>Әр жауап сұрақпен аяқталады, сөйлесу жалғасады.</li></ol><div class="ex"><i>Мысал:</i><br>— Hi! What did you do at the weekend?<br>— I go to cinema with friends.<br>— Nice! <i>I went</i> to the cinema with friends — that sounds fun. What film did you watch?</div></div>',
      okT: "✓ Дұрыс жазылған", badT: "⚠ Түзететін нәрсе бар", fixedL: "Түзетілді:",
      needPrem: "Premium қажет", chatLimit: "Чаттың күндік шегі бітті", chatFail: "Жауап берілмеді, қайтала",
      resetQ: "Чатты тазалау?", resetQBody: "Барлық әңгіме тарихы жойылады. Қайта бастайсың ба?", resetOk: "Тазалау", cancel: "Болдырмау", chatCleared: "Чат тазаланды",
      writeGen: "Жазу практикасы",
      writeInfoExam: '<div class="lxa-info"><b>IELTS Writing тексеруі қалай өтеді</b><ol><li>«Тақырып алу» түймесін бас — ИИ-емтиханшы Task 2 сұрағын береді.</li><li>Эссе жаз (250+ сөз).</li><li>«Тексеру» түймесін бас — ИИ IELTS критерийлері бойынша бағалап, талдау береді.</li></ol><div class="ex"><i>Эссе құрылымы:</i><br>1) Кіріспе — тақырыпты қайталау + ұстанымың.<br>2) 1-абзац — дәлел + мысал.<br>3) 2-абзац — екінші дәлел + мысал.<br>4) Қорытынды.<br><br><i>Байланыстырғыштар:</i> however, therefore, moreover, for example, in conclusion.</div></div>',
      writeInfoGen: '<div class="lxa-info"><b>Жазу практикасы қалай өтеді</b><ol><li>«Тапсырма алу» түймесін бас — Lexi қысқа тақырып береді.</li><li>Ағылшынша мәтін жаз.</li><li>«Тексеру» түймесін бас — Lexi деңгейіңді (A1–C1) бағалап, не жақсарту керектігін айтады.</li></ol><div class="ex"><i>Тапсырма мысалы:</i> Write a short email to a friend about your weekend.<br><br><i>Үлгі:</i><br>Hi {name}, …<br>— негізгі бөлім: не, қайда, қашан.<br>Best, {атың}.</div></div>',
      topicL: "Тақырып:", phEssay: "Мәтінді осында жаз…", wordsL: "Сөз:", minW: "кемінде 250", moreW: "неғұрлым көп болса, соғұрлым жақсы", otherTopic: "Басқа тақырып", checkBtn: "Тексеру",
      getTopicExam: "Тақырып алу", getTopicGen: "Тапсырма алу",
      bandExam: "IELTS бағасы", bandGen: "Шамамен деңгей", strengths: "Күшті жақтары", improve: "Нені жақсарту керек", notes: "Ескертулер",
      picking: "Таңдап жатырмыз…", topicReady: "Тақырып дайын · бүгін қалған тақырып: ", topicLimit: "Тақырыптың күндік шегі бітті", topicFail: "Тақырып алынбады",
      writeShort: "Кемінде біраз мәтін жаз", checking: "Тексеріп жатырмыз…", checkDone: "Дайын", checkDoneN: "Дайын · бүгін қалған тексеру: ", checkLimit: "Тексерудің күндік шегі бітті", checkFail: "Тексерілмеді, қайтала",
      stepsExam: ["Тақырып пен эссені оқимыз", "Сөз бен құрылымды санаймыз", "IELTS критерийлері бойынша бағалаймыз", "Талдау жасаймыз"],
      stepsGen: ["Мәтінді оқимыз", "Грамматика мен сөздерді тексереміз", "Деңгейді анықтаймыз", "Кеңестер жинаймыз"]
    },
    uz: {
      heroExam: "Suhbat amaliyoti va IELTS Writing", heroGen: "Suhbat va yozish amaliyoti", lvl: "daraja",
      bot: "🤖 AI suhbatdosh", bExam: "IELTS tekshiruvi", bGen: "Umumiy tekshiruv",
      tabChat: "💬 Chat", tabWrite: "✍️ Yozish",
      lockBody: "Ingliz tilida jonli chat amaliyoti va AI bilan insho tekshirish — Premium tarifida.",
      getPrem: "Premium olish", online: "onlayn", typing: "yozmoqda…",
      phInput: "Inglizcha yozing…", ariaSend: "Yuborish", hintEnter: "Enter — yuborish · Shift+Enter — yangi qator", reset: "Chatni tozalash",
      emptyHi: "Salom! Men Lexi 👋", emptySub: "Inglizcha biror narsa yozing va suhbatni boshlaymiz.",
      chatInfo: '<div class="lxa-info"><b>Chat qanday ishlaydi</b><ol><li>Istalgan mavzuda inglizcha yozing — o‘qish, rejalar, sevimli mashg‘ulot.</li><li>Lexi darajangizga mos javob berib, xatolarni yumshoq tuzatadi.</li><li>Har bir javob savol bilan tugaydi, suhbat davom etadi.</li></ol><div class="ex"><i>Misol:</i><br>— Hi! What did you do at the weekend?<br>— I go to cinema with friends.<br>— Nice! <i>I went</i> to the cinema with friends — that sounds fun. What film did you watch?</div></div>',
      okT: "✓ To‘g‘ri yozilgan", badT: "⚠ Tuzatadigan narsa bor", fixedL: "Tuzatildi:",
      needPrem: "Premium kerak", chatLimit: "Chatning kunlik limiti tugadi", chatFail: "Javob berilmadi, qayta urinib ko‘ring",
      resetQ: "Chatni tozalash?", resetQBody: "Butun suhbat tarixi o‘chiriladi. Qaytadan boshlaysizmi?", resetOk: "Tozalash", cancel: "Bekor qilish", chatCleared: "Chat tozalandi",
      writeGen: "Yozish amaliyoti",
      writeInfoExam: '<div class="lxa-info"><b>IELTS Writing tekshiruvi qanday o‘tadi</b><ol><li>«Mavzu olish» tugmasini bosing — AI imtihonchi Task 2 savolini beradi.</li><li>Insho yozing (250+ so‘z).</li><li>«Tekshirish» tugmasini bosing — AI IELTS mezonlari bo‘yicha baholab, tahlil beradi.</li></ol><div class="ex"><i>Insho tuzilishi:</i><br>1) Kirish — mavzuni qayta ifodalash + pozitsiyangiz.<br>2) 1-xatboshi — dalil + misol.<br>3) 2-xatboshi — ikkinchi dalil + misol.<br>4) Xulosa.<br><br><i>Bog‘lovchilar:</i> however, therefore, moreover, for example, in conclusion.</div></div>',
      writeInfoGen: '<div class="lxa-info"><b>Yozish amaliyoti qanday o‘tadi</b><ol><li>«Topshiriq olish» tugmasini bosing — Lexi qisqa mavzu beradi.</li><li>Inglizcha matn yozing.</li><li>«Tekshirish» tugmasini bosing — Lexi darajangizni (A1–C1) baholab, nimani yaxshilashni aytadi.</li></ol><div class="ex"><i>Topshiriq misoli:</i> Write a short email to a friend about your weekend.<br><br><i>Shablon:</i><br>Hi {name}, …<br>— asosiy qism: nima, qayerda, qachon.<br>Best, {ismingiz}.</div></div>',
      topicL: "Mavzu:", phEssay: "Matnni shu yerga yozing…", wordsL: "So‘z:", minW: "kamida 250", moreW: "qancha ko‘p bo‘lsa, shuncha yaxshi", otherTopic: "Boshqa mavzu", checkBtn: "Tekshirish",
      getTopicExam: "Mavzu olish", getTopicGen: "Topshiriq olish",
      bandExam: "IELTS bahosi", bandGen: "Taxminiy daraja", strengths: "Kuchli tomonlar", improve: "Nimani yaxshilash", notes: "Izohlar",
      picking: "Tanlanmoqda…", topicReady: "Mavzu tayyor · bugun qolgan mavzu: ", topicLimit: "Mavzuning kunlik limiti tugadi", topicFail: "Mavzu olinmadi",
      writeShort: "Kamida biroz matn yozing", checking: "Tekshirilmoqda…", checkDone: "Tayyor", checkDoneN: "Tayyor · bugun qolgan tekshiruv: ", checkLimit: "Tekshiruvning kunlik limiti tugadi", checkFail: "Tekshirilmadi, qayta urinib ko‘ring",
      stepsExam: ["Mavzu va inshoni o‘qiymiz", "So‘z va tuzilishni sanaymiz", "IELTS mezonlari bo‘yicha baholaymiz", "Tahlil tuzamiz"],
      stepsGen: ["Matnni o‘qiymiz", "Grammatika va so‘zlarni tekshiramiz", "Darajani aniqlaymiz", "Maslahatlar yig‘amiz"]
    }
  };
  function CT(k) {
    var l = (w.Lexy && w.Lexy.user && w.Lexy.user.lang) || "ru";
    var d = TX[l] || TX.ru;
    return d[k] != null ? d[k] : (TX.ru[k] != null ? TX.ru[k] : k);
  }

  /* ---------- голосовой режим (микрофон + озвучка) ---------- */
  var VX = {
    ru: { listening: "Слушаю… (говори по-английски)", noVoice: "Голосовой ввод не поддерживается в этом браузере", micOn: "Голосовой режим включён", micOff: "Голосовой режим выключен", speakOn: "Озвучивать ответы Lexi", speakOff: "Не озвучивать" },
    en: { listening: "Listening… (speak in English)", noVoice: "Voice input isn't supported in this browser", micOn: "Voice mode on", micOff: "Voice mode off", speakOn: "Speak Lexi's replies", speakOff: "Mute replies" },
    kz: { listening: "Тыңдап тұрмын… (ағылшынша сөйле)", noVoice: "Бұл браузерде дауыспен енгізу қолдау көрсетпейді", micOn: "Дауыс режимі қосулы", micOff: "Дауыс режимі өшірулі", speakOn: "Lexi жауабын дыбыстау", speakOff: "Дыбысты өшіру" },
    uz: { listening: "Tinglayapman… (inglizcha gapiring)", noVoice: "Bu brauzerda ovozli kiritish qo'llanmaydi", micOn: "Ovozli rejim yoqildi", micOff: "Ovozli rejim o'chirildi", speakOn: "Lexi javobini ovozda o'qish", speakOff: "Ovozni o'chirish" }
  };
  function V(k) { var l = (w.Lexy && w.Lexy.user && w.Lexy.user.lang) || "ru"; var d = VX[l] || VX.ru; return d[k] != null ? d[k] : (VX.ru[k] != null ? VX.ru[k] : k); }
  var SPV = null;
  function pickSpv() { if (!("speechSynthesis" in w)) return; var vs = w.speechSynthesis.getVoices().filter(function (v) { return /^en/i.test(v.lang); }); SPV = vs.filter(function (v) { return /en[-_]GB/i.test(v.lang); })[0] || vs[0] || null; }
  if ("speechSynthesis" in w) { pickSpv(); w.speechSynthesis.onvoiceschanged = pickSpv; }
  function speakText(t) {
    if (!("speechSynthesis" in w) || !t) return;
    try { w.speechSynthesis.cancel(); } catch (e) {}
    var u = new SpeechSynthesisUtterance(String(t)); u.lang = (SPV && SPV.lang) || "en-GB"; if (SPV) u.voice = SPV; u.rate = 0.98;
    w.speechSynthesis.speak(u);
  }
  function stopSpeak() { try { if ("speechSynthesis" in w) w.speechSynthesis.cancel(); } catch (e) {} }

  function injectCss() {
    if (document.getElementById("lexy-chat-css")) return;
    var s = document.createElement("style");
    s.id = "lexy-chat-css";
    s.textContent = `
.lxa-hero{position:relative;overflow:hidden;border-radius:26px;padding:24px;margin-bottom:16px;background:linear-gradient(135deg,#2A1240 0%,#4B1E6B 45%,#7A2B3A 100%);color:#fff;box-shadow:0 30px 60px -40px rgba(43,18,64,.9)}
.lxa-hero::after{content:"";position:absolute;inset:-40%;background:radial-gradient(circle at 20% 20%,rgba(255,154,10,.35),transparent 40%),radial-gradient(circle at 85% 80%,rgba(255,90,31,.35),transparent 45%);animation:lxa-drift 14s ease-in-out infinite alternate;pointer-events:none}
@keyframes lxa-drift{from{transform:translate3d(-6%,-4%,0) scale(1)}to{transform:translate3d(6%,4%,0) scale(1.15)}}
.lxa-hero .row{display:flex;align-items:center;gap:14px;position:relative;z-index:2}
.lxa-hero h2{font:800 24px var(--display);letter-spacing:-.02em;margin:0}
.lxa-hero p{margin:4px 0 0;color:rgba(255,255,255,.82);font-size:13.5px}
.lxa-mascot{width:56px;height:56px;flex:none;border-radius:18px;display:grid;place-items:center;background:rgba(255,255,255,.12);backdrop-filter:blur(4px);box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);animation:lxa-float 4s ease-in-out infinite}
@keyframes lxa-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.lxa-badges{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;position:relative;z-index:2}
.lxa-badge{font:600 12px var(--body);background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.2);padding:6px 11px;border-radius:999px}
.lxa-tabs{display:flex;gap:8px;margin-bottom:14px}
.lxa-tab{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:14px;border-radius:16px;background:#fff;border:1.5px solid var(--line);font:700 14px var(--body);color:var(--soft);transition:.18s}
.lxa-tab:hover{border-color:#FFC2A1;color:var(--fire)}
.lxa-tab.on{background:var(--ink);border-color:var(--ink);color:#fff;box-shadow:0 14px 30px -22px rgba(27,20,51,.9)}
.lxa-info{background:#FFF8F3;border:1px dashed #FFC2A1;border-radius:18px;padding:16px 18px;margin-bottom:14px}
.lxa-info b{display:block;font:800 15px var(--display);margin-bottom:8px}
.lxa-info ol,.lxa-info ul{margin:6px 0 0 18px;color:var(--soft);font-size:13.5px;line-height:1.7}
.lxa-info .ex{margin-top:10px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px 14px;font-size:13.5px;color:var(--ink)}
.lxa-info .ex i{color:var(--fire);font-style:normal;font-weight:700}
.lxa-chat{background:#fff;border:1px solid var(--line);border-radius:22px;padding:16px;box-shadow:0 22px 46px -38px rgba(27,20,51,.55)}
.lxa-stream{max-height:46vh;overflow:auto;display:flex;flex-direction:column;gap:12px;padding:4px 2px 8px}
.lxa-msg{display:flex;gap:10px;align-items:flex-end;animation:lxa-in .35s cubic-bezier(.2,.8,.3,1) both}
.lxa-msg.me{flex-direction:row-reverse}
.lxa-msg .av{width:34px;height:34px;flex:none;border-radius:12px;display:grid;place-items:center;background:var(--mist);box-shadow:inset 0 0 0 1px var(--line)}
.lxa-msg.me .av{background:linear-gradient(135deg,#FF5A1F,#FF9A0A)}
.lxa-msg .bub{max-width:78%;padding:12px 15px;border-radius:18px;font-size:14.5px;line-height:1.55;background:var(--mist);color:var(--ink);border:1px solid var(--line);white-space:pre-wrap;word-wrap:break-word}
.lxa-msg.me .bub{background:linear-gradient(135deg,#FF5A1F,#FF9A0A);color:#fff;border-color:transparent}
@keyframes lxa-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.lxa-typing{display:flex;gap:5px;padding:14px 16px}
.lxa-typing i{width:7px;height:7px;border-radius:50%;background:#C9BEE0;animation:lxa-bounce 1.2s infinite}
.lxa-typing i:nth-child(2){animation-delay:.15s}
.lxa-typing i:nth-child(3){animation-delay:.3s}
@keyframes lxa-bounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-6px);opacity:1}}
.lxa-chips{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 0}
.lxa-chip{font:600 13px var(--body);padding:9px 13px;border-radius:999px;background:#fff;border:1.5px solid var(--line);color:var(--ink);transition:.15s;cursor:pointer}
.lxa-chip:hover{border-color:var(--fire);color:var(--fire);transform:translateY(-1px)}
.lxa-input{display:flex;gap:10px;align-items:flex-end;margin-top:12px}
.lxa-input textarea{flex:1;min-height:48px;max-height:140px;resize:none;padding:13px 15px;border:1.5px solid var(--line);border-radius:16px;outline:none;font:500 14.5px/1.45 var(--body);color:var(--ink)}
.lxa-input textarea:focus{border-color:var(--fire);box-shadow:0 0 0 4px rgba(255,90,31,.12)}
.lxa-send{width:48px;height:48px;flex:none;border-radius:16px;background:var(--fire);color:#fff;display:grid;place-items:center;box-shadow:0 14px 26px -14px rgba(255,90,31,.9);transition:.15s}
.lxa-send:hover{transform:translateY(-2px)}
.lxa-mic,.lxa-spk{width:44px;height:44px;flex:none;border-radius:14px;display:grid;place-items:center;border:1.5px solid var(--line);background:#fff;color:var(--soft);transition:.15s}
.lxa-mic:hover,.lxa-spk:hover{color:var(--fire);border-color:var(--fire)}
.lxa-mic.rec{background:var(--fire);color:#fff;border-color:var(--fire);animation:lxa-rec 1.1s ease-in-out infinite}
@keyframes lxa-rec{0%,100%{box-shadow:0 0 0 0 rgba(255,90,31,.5)}50%{box-shadow:0 0 0 10px rgba(255,90,31,0)}}
.lxa-send:disabled{opacity:.5;transform:none}
.lxa-hint{font-size:12px;color:var(--soft);margin-top:8px}
.lxa-tools{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:12px}
.lxa-reset{display:inline-flex;align-items:center;gap:7px;padding:9px 14px;border-radius:999px;background:#FFF2F1;color:#E5443E;border:1.5px solid #F3C6C2;font:700 12.5px var(--body);transition:.15s}
.lxa-reset:hover{background:#FFE4E1}
.lxa-write .topic{background:linear-gradient(135deg,#FFF3EB,#F0E9FF);border:1px solid var(--line);border-radius:18px;padding:16px 18px;font-size:15px;line-height:1.55;margin:12px 0}
.lxa-write textarea{width:100%;min-height:220px;resize:vertical;padding:16px;border:1.5px solid var(--line);border-radius:16px;outline:none;font:400 15px/1.6 var(--body);color:var(--ink)}
.lxa-write textarea:focus{border-color:var(--fire);box-shadow:0 0 0 4px rgba(255,90,31,.12)}
.lxa-steps{display:flex;flex-direction:column;gap:10px;margin-top:12px}
.lxa-step{display:flex;align-items:center;gap:10px;color:var(--soft);font-size:13.5px}
.lxa-step .d{width:18px;height:18px;border-radius:50%;border:2px solid var(--line);flex:none;position:relative}
.lxa-step.on .d{border-color:var(--fire);border-right-color:transparent;animation:lxa-spin .7s linear infinite}
.lxa-step.done .d{background:#12A15C;border-color:#12A15C}
@keyframes lxa-spin{to{transform:rotate(360deg)}}
.lxa-score{display:flex;align-items:center;gap:16px;margin-bottom:6px;animation:lxa-pop .5s cubic-bezier(.3,1.4,.5,1) both}
.lxa-score .big{font:800 46px/1 var(--display);letter-spacing:-.04em;color:var(--fire)}
@keyframes lxa-pop{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:none}}
.lxa-sec{margin-top:12px;animation:lxa-in .4s both}
.lxa-sec b{display:block;margin-bottom:6px}
.lxa-sec ul{margin:0 0 0 18px;color:var(--soft);font-size:13.5px;line-height:1.6}
.lxa-check{align-self:flex-start;max-width:88%;margin-left:44px;background:#F1FBF6;border:1px solid #C8EAD7;border-radius:14px;padding:10px 14px;font-size:13.5px;animation:lxa-in .35s both}
.lxa-check.bad{background:#FFF6F5;border-color:#F3C6C2}
.lxa-fix{margin-top:7px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:9px 11px;font-size:13.5px;color:var(--ink);line-height:1.5}
/* ---- dark chat theme + more animations ---- */
.lxa-chat{position:relative;overflow:hidden;background:linear-gradient(160deg,#1C1236,#2C1342 55%,#3A1428);border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:16px;box-shadow:0 30px 60px -44px rgba(27,18,51,.95)}
.lxa-chat::before{content:"";position:absolute;inset:-30%;background:radial-gradient(circle at 12% 8%,rgba(255,154,10,.18),transparent 45%),radial-gradient(circle at 86% 92%,rgba(122,64,255,.2),transparent 45%);animation:lxa-drift 16s ease-in-out infinite alternate;pointer-events:none;z-index:0}
.lxa-chat>*{position:relative;z-index:1}
.lxa-msg .bub{background:rgba(255,255,255,.09);color:#F4F1FF;border:1px solid rgba(255,255,255,.12)}
.lxa-msg.me .bub{background:linear-gradient(135deg,#FF5A1F,#FF9A0A);color:#fff;border-color:transparent;box-shadow:0 12px 26px -16px rgba(255,90,31,.9)}
.lxa-msg .av{background:rgba(255,255,255,.1);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}
.lxa-typing i{background:#FF9A0A}
.lxa-check{background:rgba(18,161,92,.14);border-color:rgba(31,194,139,.35);color:#EAFBF3}
.lxa-check.bad{background:rgba(255,90,60,.13);border-color:rgba(255,120,90,.4);color:#FFF1ED}
.lxa-fix{background:rgba(255,255,255,.96);color:#1B1433;border-color:transparent}
.lxa-input textarea{background:rgba(255,255,255,.08);color:#F4F1FF;border:1px solid rgba(255,255,255,.15)}
.lxa-input textarea:focus{border-color:#FF9A0A;box-shadow:0 0 0 4px rgba(255,154,10,.18)}
.lxa-input textarea::placeholder{color:rgba(244,241,255,.5)}
.lxa-hint{color:rgba(244,241,255,.62)}
.lxa-chip{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);color:#F4F1FF}
.lxa-chip:hover{border-color:#FF9A0A;color:#FF9A0A}
.lxa-reset{background:rgba(255,90,60,.16);color:#FFB199;border:1px solid rgba(255,120,90,.4)}
.lxa-reset:hover{background:rgba(255,90,60,.26)}
.lxa-send{animation:lxa-pulse 2.6s ease-in-out infinite}
@keyframes lxa-pulse{0%,100%{box-shadow:0 14px 26px -14px rgba(255,90,31,.9),0 0 0 0 rgba(255,90,31,.45)}50%{box-shadow:0 14px 26px -14px rgba(255,90,31,.9),0 0 0 10px rgba(255,90,31,0)}}
.lxa-msg.me{animation:lxa-pop2 .4s cubic-bezier(.3,1.4,.5,1) both}
@keyframes lxa-pop2{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}
.lxa-empty{text-align:center;padding:26px 10px;color:#F4F1FF}
.lxa-empty .lxa-mascot{margin:0 auto 12px;background:rgba(255,255,255,.1);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}
.lxa-chathead{display:flex;align-items:center;gap:8px;margin-bottom:10px;color:#F4F1FF;font:700 14px var(--body)}
.lxa-chathead small{color:rgba(244,241,255,.6);font-weight:500}
.lxa-dot{width:9px;height:9px;border-radius:50%;background:#39D98A;animation:lxa-live 1.8s infinite}
@keyframes lxa-live{0%{box-shadow:0 0 0 0 rgba(57,217,138,.55)}70%{box-shadow:0 0 0 9px rgba(57,217,138,0)}100%{box-shadow:0 0 0 0 rgba(57,217,138,0)}}
`;
    document.head.appendChild(s);
  }

  function store(email) {
    var k = "lexy_ai_" + email;
    var d = { tab: "chat", msgs: [], topic: "", essay: "", result: null };
    try { var s = JSON.parse(localStorage.getItem(k)); if (s && typeof s === "object") { for (var x in d) if (s[x] !== undefined) d[x] = s[x]; } } catch (e) {}
    d._k = k;
    return d;
  }
  function persist(st) { try { var c = {}; for (var x in st) if (x[0] !== "_") c[x] = st[x]; localStorage.setItem(st._k, JSON.stringify(c)); } catch (e) {} }

  var ui = { busy: false, typing: false, voice: true };

  /* учёт времени общения с чатом (секунды, копим и раз в 30с сохраняем) */
  var chatT = { iv: null, last: 0, pend: 0 };
  function trackStart() {
    if (chatT.iv) return;
    chatT.last = Date.now();
    chatT.iv = setInterval(tick, 8000);
    w.addEventListener("pagehide", flushChat);
  }
  function tick() {
    var now = Date.now(), d = (now - chatT.last) / 1000; chatT.last = now;
    if (document.visibilityState !== "visible" || d > 30) return;
    var s = document.getElementById("lxaStream");
    if (!(s && s.offsetParent !== null)) return;
    chatT.pend += d;
    if (chatT.pend >= 30) flushChat();
  }
  function flushChat() {
    if (chatT.pend <= 0) return;
    var u = w.Lexy && w.Lexy.user; if (!u) return;
    var secs = chatT.pend; chatT.pend = 0;
    var totalSec = Math.round((u.chatSec || 0) + secs);
    u.chatAppMin = (u.chatAppMin || 0) + secs / 60;
    var whole = Math.floor(u.chatAppMin);
    try { w.Lexy.save({ chatSec: totalSec, chatAppMin: u.chatAppMin - whole }); } catch (e) {}
    if (whole > 0) { try { w.Lexy.addMin(whole); } catch (e) {} }
  }

  function render(el, opts) {
    opts = opts || {};
    var level = opts.level || "B1";
    var exam = opts.exam !== false;
    if (!el) return;
    if (!(w.Lexy.user && w.Lexy.user.premium)) { renderLock(el, exam); return; }
    injectCss();
    var st = store((w.Lexy.user && w.Lexy.user.email) || "anon");
    var hero = '<div class="lxa-hero"><div class="row"><span class="lxa-mascot">' + flame(38) + '</span><div><h2>Lexi AI</h2><p>' + (exam ? CT("heroExam") : CT("heroGen")) + " · " + CT("lvl") + " " + esc(level) + '</p></div></div><div class="lxa-badges"><span class="lxa-badge">' + CT("bot") + '</span><span class="lxa-badge">' + esc(level) + '</span><span class="lxa-badge">' + (exam ? CT("bExam") : CT("bGen")) + '</span></div><div class="lxa-breathe"></div></div>';
    var tabs = '<div class="lxa-tabs" id="lxaTabs"><button class="lxa-tab' + (st.tab === "chat" ? " on" : "") + '" data-t="chat">' + CT("tabChat") + '</button><button class="lxa-tab' + (st.tab === "writing" ? " on" : "") + '" data-t="writing">' + CT("tabWrite") + "</button></div>";
    el.innerHTML = hero + tabs + '<div id="lxaBody"></div>';
    $("#lxaTabs", el).addEventListener("click", function (e) {
      var b = e.target.closest("[data-t]"); if (!b) return;
      st.tab = b.dataset.t; persist(st);
      el.querySelectorAll(".lxa-tab").forEach(function (x) { x.classList.toggle("on", x === b); });
      draw(el, st, level, exam);
    });
    draw(el, st, level, exam);
    trackStart();
  }

  function renderLock(el, exam) {
    injectCss();
    el.innerHTML = '<div class="lxa-hero" style="margin-bottom:16px"><div class="row"><span class="lxa-mascot">' + flame(38) + '</span><div><h2>Lexi AI</h2><p>' + (exam ? CT("heroExam") : CT("heroGen")) + '</p></div></div></div>' +
      '<div class="card" style="text-align:center"><div style="font-size:40px">🔒</div><h2 style="font:800 22px var(--display);margin:10px 0">Lexi AI — Premium</h2>' +
      '<p class="s">' + CT("lockBody") + '</p>' +
      '<a class="btn p" href="pricing.html" style="margin-top:14px">' + CT("getPrem") + "</a></div>";
  }

  function draw(el, st, level, exam) {
    injectCss();
    var body = $("#lxaBody", el);
    if (st.tab === "chat") drawChat(body, st, level);
    else drawWriting(body, st, level, exam);
  }

  function drawChat(body, st, level) {
    var info = CT("chatInfo");
    var stream = st.msgs.length ? st.msgs.map(function (m, i) { return msgHtml(m, i); }).join("") : emptyChat();
    body.innerHTML = info + '<div class="lxa-chat"><div class="lxa-chathead"><span class="lxa-dot"></span><b>Lexi</b><small id="lxaStatus">' + CT("online") + '</small></div><div class="lxa-stream" id="lxaStream">' + stream + "</div>" +
      '<div class="lxa-input"><textarea id="lxaIn" placeholder="' + CT("phInput") + '" rows="1"></textarea><button class="lxa-spk" id="lxaVoice" aria-pressed="true">🔊</button><button class="lxa-mic" id="lxaMic" aria-label="' + V("micOn") + '" title="' + V("micOn") + '">' + ic("mic") + '</button><button class="lxa-send" id="lxaSend" aria-label="' + CT("ariaSend") + '">' + ic("send") + "</button></div>" +
      '<div class="lxa-tools"><span class="lxa-hint">' + CT("hintEnter") + '</span><button class="lxa-reset" id="lxaReset">' + ic("x") + " " + CT("reset") + "</button></div></div>";
    sc(stream); var box = $("#lxaStream", body); if (box) box.scrollTop = box.scrollHeight;
    wireChat(body, st, level);
  }

  function emptyChat() {
    return '<div class="lxa-empty"><div class="lxa-mascot">' + flame(34) + '</div><b style="font:800 16px var(--display)">' + CT("emptyHi") + '</b><p style="margin-top:6px;color:rgba(244,241,255,.65)">' + CT("emptySub") + "</p></div>";
  }
  function msgHtml(m, idx) {
    var d = ' style="animation-delay:' + (Math.min(idx || 0, 12) * 0.04).toFixed(2) + 's"';
    if (m.role === "check") {
      var ok = m.correct;
      var inner = ok
        ? '<span style="color:#39D98A;font-weight:700">' + CT("okT") + '</span>'
        : '<span style="color:#FF8A6A;font-weight:700">' + CT("badT") + '</span>' + (m.explanation ? '<div style="color:rgba(244,241,255,.75);font-size:13px;margin-top:4px">' + esc(m.explanation) + "</div>" : "") + (m.corrected ? '<div class="lxa-fix"><b style="color:#FF5A1F">' + CT("fixedL") + '</b> ' + esc(m.corrected) + "</div>" : "");
      return '<div class="lxa-check' + (ok ? "" : " bad") + '"' + d + ">" + inner + "</div>";
    }
    var me = m.role === "user";
    return '<div class="lxa-msg' + (me ? " me" : "") + '"' + d + '><span class="av">' + (me ? ic("user") : flame(22)) + '</span><div class="bub">' + esc(m.content) + "</div></div>";
  }
  function sc(stream) { var box = $("#lxaStream"); if (box) box.scrollTop = box.scrollHeight; }

  function wireChat(body, st, level) {
    var inp = $("#lxaIn", body), send = $("#lxaSend", body);
    function autoGrow() { inp.style.height = "auto"; inp.style.height = Math.min(140, inp.scrollHeight) + "px"; }
    inp.addEventListener("input", autoGrow);
    send.addEventListener("click", go);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); go(); } });

    /* --- голос: озвучка ответов + микрофонный ввод --- */
    var spkBtn = $("#lxaVoice", body), micBtn = $("#lxaMic", body);
    ui.voice = ui.voice !== false;
    function paintVoice() { if (spkBtn) { spkBtn.textContent = ui.voice ? "🔊" : "🔇"; spkBtn.setAttribute("aria-pressed", ui.voice ? "true" : "false"); spkBtn.title = ui.voice ? V("speakOn") : V("speakOff"); } }
    paintVoice();
    if (spkBtn) spkBtn.addEventListener("click", function () { ui.voice = !ui.voice; if (!ui.voice) stopSpeak(); paintVoice(); toast(ui.voice ? V("speakOn") : V("speakOff")); });
    var SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR || !micBtn) { if (micBtn) micBtn.style.display = "none"; }
    else {
      var rec = new SR(); rec.lang = "en-US"; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
      var listening = false, finalTxt = "";
      function setRec(on) { listening = on; if (micBtn) micBtn.classList.toggle("rec", on); if (!on) { var s = $("#lxaStatus", body); if (s) s.textContent = CT("online"); } }
      micBtn.addEventListener("click", function () { if (listening) { try { rec.stop(); } catch (e) {} return; } finalTxt = ""; try { rec.start(); } catch (e) {} });
      rec.onstart = function () { setRec(true); var s = $("#lxaStatus", body); if (s) s.textContent = V("listening"); toast(V("listening")); };
      rec.onend = function () { setRec(false); var t = finalTxt.trim(); if (t) { inp.value = ((inp.value || "").trim() + " " + t).trim(); autoGrow(); ui.voice = true; paintVoice(); go(); } };
      rec.onerror = function () { setRec(false); };
      rec.onresult = function (e) { finalTxt = ""; for (var i = 0; i < e.results.length; i++) finalTxt += e.results[i][0].transcript + " "; };
    }

    function go() {
      var text = (inp.value || "").trim(); if (!text || ui.busy) return;
      ui.busy = true; inp.value = ""; autoGrow();
      var um = { role: "user", content: text };
      st.msgs.push(um); persist(st);
      appendMsg(um);
      showTyping();
      call({ mode: "chat", level: level, messages: st.msgs }).then(function (d) {
        ui.busy = false; hideTyping();
        if (d && d.grammar) { var c = { role: "check", correct: d.grammar.correct, explanation: d.grammar.explanation, corrected: d.grammar.corrected }; st.msgs.push(c); appendMsg(c); }
        if (d && d.reply) { var a = { role: "assistant", content: d.reply }; st.msgs.push(a); appendMsg(a); if (ui.voice) speakText(d.reply); }
        persist(st);
      }).catch(function (err) {
        ui.busy = false; hideTyping();
        if (err && err.code === "premium_required") toast(CT("needPrem"));
        else if (err && err.code === "limit") toast(CT("chatLimit"));
        else toast(CT("chatFail"));
      });
    }
    $("#lxaReset", body).addEventListener("click", function () {
      w.Lexy.modal({ title: CT("resetQ"), body: "<p>" + CT("resetQBody") + "</p>", ok: CT("resetOk"), cancel: CT("cancel"), onOk: function () { st.msgs = []; persist(st); drawChat(body, st, level); toast(CT("chatCleared")); } });
    });
  }

  function nodeFor(m) { var t = document.createElement("div"); t.innerHTML = msgHtml(m, 0); return t.firstChild; }
  function appendMsg(m) {
    var box = $("#lxaStream"); if (!box) return;
    var e = $(".lxa-empty", box); if (e) e.remove();
    var n = nodeFor(m);
    if (n) { n.style.animationDelay = "0s"; box.appendChild(n); box.scrollTop = box.scrollHeight; }
  }
  function setStatus(t) { var s = document.getElementById("lxaStatus"); if (s) s.textContent = t; }
  function showTyping() {
    var box = $("#lxaStream");
    if (!box) return;
    var e = $(".lxa-empty", box); if (e) e.remove();
    var t = document.createElement("div");
    t.innerHTML = '<div class="lxa-msg" id="lxaTyping"><span class="av">' + flame(22) + '</span><div class="bub" style="padding:0"><span class="lxa-typing"><i></i><i></i><i></i></span></div></div>';
    box.appendChild(t.firstChild);
    box.scrollTop = box.scrollHeight;
    setStatus(CT("typing"));
  }
  function hideTyping() { var t = document.getElementById("lxaTyping"); if (t) t.remove(); setStatus(CT("online")); }
  function reStream(st) { var box = $("#lxaStream"); if (!box) return; box.innerHTML = st.msgs.length ? st.msgs.map(function (m, i) { return msgHtml(m, i); }).join("") : emptyChat(); box.scrollTop = box.scrollHeight; }

  function drawWriting(body, st, level, exam) {
    var info = exam ? CT("writeInfoExam") : CT("writeInfoGen");
    var topic = st.topic ? '<div class="topic"><b>' + CT("topicL") + '</b> ' + esc(st.topic) + "</div>" : "";
    var editor = st.topic
      ? topic + '<textarea id="lxaEssay" placeholder="' + CT("phEssay") + '">' + esc(st.essay || "") + '</textarea><div class="lxa-tools"><span class="lxa-hint">' + CT("wordsL") + ' <b id="lxaWc">0</b> · ' + (exam ? CT("minW") : CT("moreW")) + '</span><button class="lxa-reset" id="lxaNewTopic">' + CT("otherTopic") + '</button></div><button class="btn p big" id="lxaCheck" style="margin-top:12px">' + CT("checkBtn") + "</button>"
      : "";
    var result = st.result ? resultHtml(st.result, exam) : "";
    body.innerHTML = info + '<div class="lxa-chat lxa-write">' +
      (st.topic ? "" : '<button class="btn p big" id="lxaTopic">' + ic("spark") + " " + (exam ? CT("getTopicExam") : CT("getTopicGen")) + "</button>") +
      '<div id="lxaSteps"></div>' + editor + result + "</div>";
    wireWriting(body, st, level, exam);
  }

  function resultHtml(r, exam) {
    var big = (r.band != null ? r.band : "—");
    var lbl = exam ? CT("bandExam") : CT("bandGen");
    function list(t, arr) { return (arr && arr.length) ? '<div class="lxa-sec"><b>' + t + '</b><ul>' + arr.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>" : ""; }
    return '<div class="lxa-chat" style="margin-top:14px"><div class="lxa-score"><div class="big">' + esc(big) + '</div><div><b style="font:800 16px var(--display)">' + lbl + '</b><div class="s" style="margin:0">' + esc(r.summary || "") + '</div></div></div>' +
      list(CT("strengths"), r.strengths) + list(CT("improve"), r.improvements) + list(CT("notes"), r.corrections) + "</div>";
  }

  function wireWriting(body, st, level, exam) {
    var tb = $("#lxaTopic", body);
    if (tb) tb.addEventListener("click", function () {
      if (ui.busy) return; ui.busy = true; tb.classList.add("on"); tb.innerHTML = ic("spark") + " " + CT("picking");
      call({ mode: "writing-topic", level: level, exam: exam }).then(function (d) {
        ui.busy = false; st.topic = (d && d.topic) || ""; st.result = null; st.essay = ""; persist(st); drawWriting(body, st, level, exam);
        if (d && d.remaining != null) toast(CT("topicReady") + d.remaining);
      }).catch(function (err) {
        ui.busy = false; drawWriting(body, st, level, exam);
        if (err && err.code === "premium_required") toast(CT("needPrem"));
        else if (err && err.code === "limit") toast(CT("topicLimit"));
        else toast(CT("topicFail"));
      });
    });
    var nt = $("#lxaNewTopic", body);
    if (nt) nt.addEventListener("click", function () { st.topic = ""; st.essay = ""; st.result = null; persist(st); drawWriting(body, st, level, exam); });
    var ta = $("#lxaEssay", body), wc = $("#lxaWc", body), chk = $("#lxaCheck", body);
    if (ta) {
      function cnt() { wc.textContent = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0; }
      cnt();
      ta.addEventListener("input", function () { st.essay = ta.value; persist(st); cnt(); });
      chk.addEventListener("click", function () {
        var words = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0;
        if (words < 20) { toast(CT("writeShort")); return; }
        if (ui.busy) return; ui.busy = true;
        st.essay = ta.value; persist(st);
        chk.disabled = true; chk.textContent = CT("checking");
        runSteps(exam, function () {});
        call({ mode: "writing-check", level: level, exam: exam, topic: st.topic, essay: ta.value }).then(function (d) {
          ui.busy = false; st.result = (d && d.result) || null; persist(st); drawWriting(body, st, level, exam);
          toast(d && d.remaining != null ? CT("checkDoneN") + d.remaining : CT("checkDone"));
        }).catch(function (err) {
          ui.busy = false; chk.disabled = false; chk.textContent = CT("checkBtn");
          $("#lxaSteps", body).innerHTML = "";
          if (err && err.code === "premium_required") toast(CT("needPrem"));
          else if (err && err.code === "limit") toast(CT("checkLimit"));
          else toast(CT("checkFail"));
        });
      });
    }
  }

  function runSteps(exam, done) {
    var steps = exam ? CT("stepsExam") : CT("stepsGen");
    var box = document.getElementById("lxaSteps");
    if (!box) return;
    box.innerHTML = '<div class="lxa-steps">' + steps.map(function (s) { return '<div class="lxa-step"><span class="d"></span>' + s + "</div>"; }).join("") + "</div>";
    var items = box.querySelectorAll(".lxa-step");
    var i = 0;
    var iv = setInterval(function () {
      if (i > 0 && items[i - 1]) { items[i - 1].classList.remove("on"); items[i - 1].classList.add("done"); }
      if (i >= items.length) { clearInterval(iv); return; }
      items[i].classList.add("on"); i++;
    }, 700);
  }

  w.LexyChat = { render: render, call: call };
})(window);