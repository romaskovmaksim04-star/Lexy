/* ==========================================================
   lexy-vocab.js — Словарь Lexy (Premium)
   • Оформление в стиле «Разговора»
   • Уровень = уровень из раздела «Путь» (курс)
   • Поиск слов (выпадающий список) вместо длинного списка
   • «знаю / не знаю» + повторение (SRS), свои слова, озвучка
   • Перевод по языку профиля (RU / EN / KZ / UZ)
   ========================================================== */
(function (w) {
  "use strict";

  /* данные: [en, ru, kz, uz, gloss] */
  var WORDS = w.LEXY_VOCAB_DATA || {};
  var LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
  var LV_ACCENT = { A1: "#12A15C", A2: "#1E8FE8", B1: "#F7620B", B2: "#C02FB0", C1: "#7A40FF", C2: "#E5443E" };
  var LV_NAME = {
    ru: { A1: "Начальный", A2: "Элементарный", B1: "Средний", B2: "Выше среднего", C1: "Продвинутый", C2: "В совершенстве" },
    en: { A1: "Beginner", A2: "Elementary", B1: "Intermediate", B2: "Upper-Intermediate", C1: "Advanced", C2: "Proficient" },
    kz: { A1: "Бастауыш", A2: "Элементарлық", B1: "Орташа", B2: "Орташадан жоғары", C1: "Жетік", C2: "Кемел" },
    uz: { A1: "Boshlang'ich", A2: "Elementar", B1: "O'rta", B2: "O'rtadan yuqori", C1: "Ilg'or", C2: "Mukammal" }
  };
  var INTERVAL = [0, 1, 2, 4, 7, 15, 30];
  var KNOWN_BOX = 5;

  var UI = {
    ru: { title: "Словарь", sub: "Слова твоего уровня · «знаю / не знаю» → умное повторение", learn: "Учить слова", review: "Повторение", level: "Уровень", known: "Знаю", learning: "Учу", fresh: "Новые", words: "слов", search: "Начни вводить слово — покажу перевод…", addT: "Своё слово", wordPh: "слово", transPh: "перевод", add: "Добавить", know: "Знаю", dont: "Не знаю", show: "Показать перевод", finish: "Завершить", done: "Сессия завершена", back: "К словарю", toast1: "Введи слово", added: "Добавлено: ", locked: "Словарь доступен в Premium", lockBody: "Слова по уровням, «знаю / не знаю» и умное повторение — на тарифах Pro и Pro+.", getPrem: "Получить Premium", speak: "Прослушать", customLv: "Своё", revNone: "Сейчас нечего повторять — начни учить слова 🎉", notFound: "Ничего не найдено", lvWords: "слов на уровне", hint: "Введи слово, чтобы найти перевод. Или начни учить слова кнопкой выше.", knowLbl: "выучено", revLbl: "повторение", newLbl: "новое", of: "из", myWords: "Мои слова" },
    en: { title: "Vocabulary", sub: "Words for your level · know / don't know → smart review", learn: "Study words", review: "Review", level: "Level", known: "Known", learning: "Learning", fresh: "New", words: "words", search: "Start typing a word — I'll show the translation…", addT: "Your own word", wordPh: "word", transPh: "translation", add: "Add", know: "I know", dont: "Don't know", show: "Show translation", finish: "Finish", done: "Session complete", back: "Back to vocabulary", toast1: "Enter a word", added: "Added: ", locked: "Vocabulary is available in Premium", lockBody: "Words by level, know / don't know and smart review — on Pro and Pro+.", getPrem: "Get Premium", speak: "Listen", customLv: "Custom", revNone: "Nothing to review yet — start studying words 🎉", notFound: "Nothing found", lvWords: "words at this level", hint: "Type a word to find its translation. Or start studying with the button above.", knowLbl: "learned", revLbl: "review", newLbl: "new", of: "of", myWords: "My words" },
    kz: { title: "Сөздік", sub: "Деңгейіңнің сөздері · «білемін / білмеймін» → ақылды қайталау", learn: "Сөздерді оқу", review: "Қайталау", level: "Деңгей", known: "Білемін", learning: "Оқып жатырмын", fresh: "Жаңа", words: "сөз", search: "Сөз жаза баста — аудармасын көрсетемін…", addT: "Өз сөзің", wordPh: "сөз", transPh: "аударма", add: "Қосу", know: "Білемін", dont: "Білмеймін", show: "Аударманы көрсету", finish: "Аяқтау", done: "Сессия аяқталды", back: "Сөздікке", toast1: "Сөз енгіз", added: "Қосылды: ", locked: "Сөздік Premium-да қолжетімді", lockBody: "Деңгейлер бойынша сөздер, «білемін / білмеймін» және ақылды қайталау — Pro және Pro+.", getPrem: "Premium алу", speak: "Тыңдау", customLv: "Өзімнің", revNone: "Әзірге қайталайтын нәрсе жоқ — сөз оқуды баста 🎉", notFound: "Ештеңе табылмады", lvWords: "сөз осы деңгейде", hint: "Аударманы табу үшін сөз енгіз. Немесе жоғарыдағы түймемен оқуды баста.", knowLbl: "үйренілді", revLbl: "қайталау", newLbl: "жаңа", of: "/", myWords: "Менің сөздерім" },
    uz: { title: "Lug'at", sub: "Darajangiz so'zlari · «bilaman / bilmayman» → aqlli takrorlash", learn: "So'zlarni o'rganish", review: "Takrorlash", level: "Daraja", known: "Bilaman", learning: "O'rganyapman", fresh: "Yangi", words: "so'z", search: "So'z yozishni boshlang — tarjimasini ko'rsataman…", addT: "O'z so'zingiz", wordPh: "so'z", transPh: "tarjima", add: "Qo'shish", know: "Bilaman", dont: "Bilmayman", show: "Tarjimani ko'rsatish", finish: "Tugatish", done: "Sessiya tugadi", back: "Lug'atga", toast1: "So'z kiriting", added: "Qo'shildi: ", locked: "Lug'at Premium'da mavjud", lockBody: "Darajalar bo'yicha so'zlar, «bilaman / bilmayman» va aqlli takrorlash — Pro va Pro+.", getPrem: "Premium olish", speak: "Tinglash", customLv: "O'zimniki", revNone: "Hozir takrorlanadigan narsa yo'q — so'z o'rganishni boshlang 🎉", notFound: "Hech narsa topilmadi", lvWords: "so'z bu darajada", hint: "Tarjimani topish uchun so'z kiriting. Yoki yuqoridagi tugma bilan o'rganishni boshlang.", knowLbl: "o'rganilgan", revLbl: "takrorlash", newLbl: "yangi", of: "/", myWords: "Mening so'zlarim" }
  };

  function lang() { return (w.Lexy.user && w.Lexy.user.lang) || "ru"; }
  function T() { return UI[lang()] || UI.ru; }
  function lvName(lv) { var l = LV_NAME[lang()] || LV_NAME.ru; return l[lv] || lv; }
  function $ (s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ic(n) { return w.Lexy.ic(n); }
  function flame(h) { try { return w.Lexy.fl(h); } catch (e) { return ""; } }
  function toast(t) { try { w.Lexy.toast(t); } catch (e) {} }

  function tr(o) {
    var en = o[0], ru = o[1], kz = o[2], uz = o[3], gl = o[4], l = lang();
    if (l === "en") return gl || en;
    if (l === "kz") return kz || ru || en;
    if (l === "uz") return uz || ru || en;
    return ru || en;
  }
  function courseLevel() {
    var u = w.Lexy.user || {};
    return (u.course && u.course.level) || (u.onboard && (u.onboard.level || u.onboard.l)) || "A1";
  }

  /* ---------- состояние SRS ---------- */
  function state() {
    var u = w.Lexy.user;
    if (!u.vocab) u.vocab = {};
    var v = u.vocab;
    if (!v.st) v.st = {};
    if (!v.custom) v.custom = {};
    if (v.manual == null) v.manual = false;
    if (!v.manual) v.level = courseLevel();
    if (!v.level) v.level = "A1";
    return v;
  }
  function saveVocab() { w.Lexy.save({ vocab: state() }); }
  function stOf(x) { var s = state().st, k = String(x).toLowerCase(); if (!s[k]) s[k] = { b: 0, due: 0 }; return s[k]; }
  function isKnown(x) { return stOf(x).b >= KNOWN_BOX; }

  function byLevel(lv) {
    var base = (WORDS[lv] || []).map(function (o) { return { w: o[0], d: o, lv: lv }; });
    var cust = (state().custom[lv] || []).map(function (o) { return { w: o.w, d: [o.w, o.t, o.t, o.t, o.t], lv: lv, custom: true }; });
    return cust.concat(base);
  }
  function totalAll() { var n = 0; LEVELS.forEach(function (l) { n += byLevel(l).length; }); return n; }
  function progress(lv) {
    lv = lv || state().level;
    var list = byLevel(lv), known = 0, learning = 0, fresh = 0;
    list.forEach(function (o) { var b = stOf(o.w).b; if (b >= KNOWN_BOX) known++; else if (b > 0) learning++; else fresh++; });
    return { total: list.length, known: known, learning: learning, fresh: fresh, pct: list.length ? Math.round(known / list.length * 100) : 0 };
  }
  function dueWords() {
    var now = Date.now(), out = [];
    byLevel(state().level).forEach(function (o) { var s = stOf(o.w); if (s.b > 0 && s.b < KNOWN_BOX && s.due <= now) out.push(o); });
    return out;
  }
  function reviewCount() { return dueWords().length; }

  function answer(x, knew) {
    var s = stOf(x);
    s.b = knew ? Math.min(KNOWN_BOX, s.b + 1) : 0;
    s.due = Date.now() + (INTERVAL[s.b] || 0) * 864e5;
    saveVocab();
    return s;
  }
  function addCustom(lv, word, trans) {
    var v = state();
    if (!v.custom[lv]) v.custom[lv] = [];
    var dup = v.custom[lv].some(function (o) { return o.w.toLowerCase() === word.toLowerCase(); }) || (WORDS[lv] || []).some(function (o) { return o[0].toLowerCase() === word.toLowerCase(); });
    if (dup) return false;
    v.custom[lv].push({ w: word, t: trans || "" });
    v.st[word.toLowerCase()] = { b: 0, due: 0 };
    saveVocab();
    return true;
  }

  function speak(text) {
    if (!("speechSynthesis" in w)) return;
    try {
      w.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "en-GB";
      var vs = w.speechSynthesis.getVoices() || [];
      var v = vs.filter(function (x) { return /en[-_](GB|US|AU)/i.test(x.lang); })[0] || vs.filter(function (x) { return /^en/i.test(x.lang); })[0];
      if (v) u.voice = v;
      u.rate = 0.95;
      w.speechSynthesis.speak(u);
    } catch (e) {}
  }

  /* ---------- CSS ---------- */
  function injectCss() {
    if (document.getElementById("lexy-vocab-css")) return;
    var s = document.createElement("style");
    s.id = "lexy-vocab-css";
    s.textContent = `
.lxv-hero{position:relative;overflow:hidden;border-radius:26px;padding:24px;margin-bottom:16px;background:linear-gradient(135deg,#0F2A24 0%,#14364A 45%,#2A1240 100%);color:#fff;box-shadow:0 30px 60px -40px rgba(15,42,36,.95)}
.lxv-hero::after{content:"";position:absolute;inset:-40%;background:radial-gradient(circle at 18% 22%,rgba(18,161,92,.4),transparent 42%),radial-gradient(circle at 84% 78%,rgba(122,64,255,.4),transparent 46%),radial-gradient(circle at 60% 10%,rgba(255,154,10,.22),transparent 40%);animation:lxv-drift 15s ease-in-out infinite alternate;pointer-events:none}
@keyframes lxv-drift{from{transform:translate3d(-6%,-4%,0) scale(1)}to{transform:translate3d(6%,4%,0) scale(1.14)}}
.lxv-hero .row{position:relative;z-index:2;display:flex;align-items:center;gap:16px}
.lxv-mascot{width:58px;height:58px;flex:none;border-radius:18px;display:grid;place-items:center;background:rgba(255,255,255,.12);backdrop-filter:blur(4px);box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);animation:lxv-float 4s ease-in-out infinite}
@keyframes lxv-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.lxv-hero h2{font:800 25px var(--display);letter-spacing:-.02em;margin:0}
.lxv-hero p{margin:4px 0 0;color:rgba(255,255,255,.82);font-size:13px;line-height:1.45;max-width:44ch}
.lxv-ring{position:relative;z-index:2;width:78px;height:78px;flex:none;margin-left:auto}
.lxv-ring svg{width:100%;height:100%;transform:rotate(-90deg)}
.lxv-ring .bg{fill:none;stroke:rgba(255,255,255,.16);stroke-width:9}
.lxv-ring .fg{fill:none;stroke:#39D98A;stroke-width:9;stroke-linecap:round;transition:stroke-dashoffset .8s cubic-bezier(.3,1,.4,1)}
.lxv-ring b{position:absolute;inset:0;display:grid;place-items:center;font:800 20px var(--display)}
.lxv-badges{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;position:relative;z-index:2}
.lxv-badge{font:600 12px var(--body);background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.2);padding:6px 11px;border-radius:999px}
.lxv-actions{display:flex;gap:10px;margin-top:16px;position:relative;z-index:2;flex-wrap:wrap}
.lxv-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 18px;border-radius:15px;font:700 14px var(--body);transition:.16s;cursor:pointer;border:0}
.lxv-btn.p{background:linear-gradient(135deg,#12A15C,#1FBF7A);color:#fff;box-shadow:0 16px 30px -16px rgba(18,161,92,.95)}
.lxv-btn.p:hover{transform:translateY(-2px)}
.lxv-btn.g{background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.22)}
.lxv-btn.g:hover{background:rgba(255,255,255,.2)}
.lxv-btn:disabled{opacity:.5;cursor:default;transform:none}
.lxv-btn em{font:700 11px var(--display);font-style:normal;background:rgba(255,255,255,.25);border-radius:999px;padding:2px 8px}
.lxv-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
.lxv-stat{background:#fff;border:1.5px solid var(--line);border-radius:18px;padding:14px;text-align:center;position:relative;overflow:hidden}
.lxv-stat::before{content:"";position:absolute;inset:0 auto 0 0;width:4px;background:var(--ac,#12A15C)}
.lxv-stat b{display:block;font:800 24px var(--display);letter-spacing:-.03em;color:var(--ac,#12A15C)}
.lxv-stat small{display:block;color:var(--soft);font:600 11.5px var(--body);margin-top:2px}
.lxv-levels{display:flex;gap:8px;overflow-x:auto;padding:2px 0 8px;margin-bottom:10px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.lxv-levels::-webkit-scrollbar{display:none}
.lxv-lchip{flex:none;display:inline-flex;align-items:center;gap:7px;padding:10px 14px;border-radius:14px;background:#fff;border:1.5px solid var(--line);font:700 13.5px var(--body);color:var(--soft);transition:.16s;cursor:pointer}
.lxv-lchip em{font:700 11px var(--display);font-style:normal;color:var(--soft);background:var(--mist);border-radius:999px;padding:2px 7px}
.lxv-lchip:hover{border-color:var(--fire);color:var(--fire)}
.lxv-lchip.on{border-color:transparent;color:#fff;box-shadow:0 14px 26px -16px rgba(27,20,51,.6)}
.lxv-lchip.on em{background:rgba(255,255,255,.25);color:#fff}
.lxv-search{display:flex;align-items:center;gap:11px;background:#fff;border:1.5px solid var(--line);border-radius:17px;padding:15px 17px;margin-bottom:14px;box-shadow:0 18px 34px -30px rgba(27,20,51,.5);transition:.15s}
.lxv-search:focus-within{border-color:var(--fire);box-shadow:0 0 0 4px rgba(255,90,31,.12)}
.lxv-search .si{color:var(--soft);flex:none;display:grid;place-items:center}
.lxv-search input{border:0;background:none;outline:none;flex:1;font:500 15px var(--body);color:var(--ink)}
.lxv-search input::placeholder{color:var(--soft)}
.lxv-clr{flex:none;width:30px;height:30px;border-radius:9px;display:none;place-items:center;background:var(--mist);color:var(--soft);cursor:pointer;border:0}
.lxv-search.has .lxv-clr{display:grid}
.lxv-results{display:flex;flex-direction:column;gap:9px}
.lxv-hint{text-align:center;padding:30px 16px;color:var(--soft);font-size:13.5px;line-height:1.6}
.lxv-hint .lxv-mascot{margin:0 auto 12px;background:var(--mist);box-shadow:inset 0 0 0 1px var(--line);width:56px;height:56px}
.lxv-row{display:flex;align-items:center;gap:13px;background:#fff;border:1.5px solid var(--line);border-radius:17px;padding:13px 15px;animation:lxv-in .3s cubic-bezier(.2,.8,.3,1) both;transition:transform .15s,border-color .15s,box-shadow .15s}
.lxv-row:hover{transform:translateY(-2px);border-color:#FFC2A1;box-shadow:0 18px 34px -26px rgba(27,20,51,.5)}
@keyframes lxv-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.lxv-row .spk{width:38px;height:38px;flex:none;border-radius:12px;background:var(--mist);display:grid;place-items:center;color:var(--soft);cursor:pointer;transition:.15s;border:0}
.lxv-row .spk:hover{background:var(--peach,#FFE9DF);color:var(--fire)}
.lxv-row .tx{flex:1;min-width:0}
.lxv-row .tx b{display:block;font:700 15.5px var(--body);color:var(--ink)}
.lxv-row .tx small{display:block;color:var(--soft);font-size:13px;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lxv-row .st{font:700 10.5px var(--display);letter-spacing:.03em;padding:5px 9px;border-radius:999px;flex:none;white-space:nowrap}
.lxv-row .st.k{background:#DDF6EC;color:#0E8548}
.lxv-row .st.l{background:#FFF3E0;color:#C97A00}
.lxv-row .st.n{background:var(--mist);color:var(--soft)}
.lxv-add{background:linear-gradient(135deg,#FFF8F3,#F3EEFF);border:1px dashed #FFC2A1;border-radius:20px;padding:18px;margin-top:16px}
.lxv-add b{display:flex;align-items:center;gap:8px;font:800 16px var(--display);margin-bottom:10px}
.lxv-add .f{display:flex;gap:9px;flex-wrap:wrap}
.lxv-add input{flex:1;min-width:130px;padding:12px 14px;border:1.5px solid var(--line);border-radius:13px;outline:none;font:500 14px var(--body);background:#fff}
.lxv-add input:focus{border-color:var(--fire);box-shadow:0 0 0 4px rgba(255,90,31,.12)}
.lxv-add button{padding:12px 18px;border-radius:13px;background:var(--fire);color:#fff;font:700 14px var(--body);display:inline-flex;align-items:center;gap:7px;border:0;cursor:pointer}
.lxv-sess{max-width:560px;margin:0 auto}
.lxv-sess .top{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.lxv-sess .top .lv{font:700 12px var(--display);letter-spacing:.04em;padding:6px 11px;border-radius:999px;background:var(--mist);color:var(--soft)}
.lxv-sess .top .cnt{margin-left:auto;font:700 13px var(--body);color:var(--soft)}
.lxv-sess .bar{height:8px;border-radius:999px;background:var(--mist);overflow:hidden;margin-bottom:20px}
.lxv-sess .bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#12A15C,#39D98A);transition:width .4s}
.lxv-card .inner{position:relative;border-radius:26px;padding:36px 24px;min-height:230px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:linear-gradient(160deg,#1C1236,#2C1342 55%,#16332C);color:#fff;box-shadow:0 34px 64px -44px rgba(27,18,51,.95);overflow:hidden;animation:lxv-in .4s both}
.lxv-card .inner::before{content:"";position:absolute;inset:-30%;background:radial-gradient(circle at 15% 15%,rgba(18,161,92,.28),transparent 45%),radial-gradient(circle at 85% 85%,rgba(122,64,255,.28),transparent 45%);animation:lxv-drift 14s ease-in-out infinite alternate}
.lxv-card .inner>*{position:relative;z-index:1}
.lxv-card .kind{font:700 11px var(--display);letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.6);margin-bottom:14px}
.lxv-card .w{font:800 clamp(30px,8vw,46px)/1.1 var(--display);letter-spacing:-.03em;display:inline-flex;align-items:center;gap:14px}
.lxv-card .w .spk{width:44px;height:44px;border-radius:14px;background:rgba(255,255,255,.12);display:grid;place-items:center;color:#fff;cursor:pointer;transition:.15s;flex:none;border:0}
.lxv-card .w .spk:hover{background:rgba(255,255,255,.24)}
.lxv-card .tr{font:600 20px var(--body);color:#FFD9A8;margin-top:16px;opacity:0;transform:translateY(8px);transition:opacity .3s,transform .3s}
.lxv-card .tr.on{opacity:1;transform:none}
.lxv-cbtns{display:flex;gap:10px;justify-content:center;margin-top:20px;position:relative;z-index:1;flex-wrap:wrap;width:100%}
.lxv-cbtn{padding:13px 24px;border-radius:15px;font:700 14.5px var(--body);transition:.15s;cursor:pointer;border:0}
.lxv-cbtn.no{background:#FFF2F1;color:#E5443E;border:1.5px solid #F3C6C2}
.lxv-cbtn.no:hover{background:#FFE4E1;transform:translateY(-2px)}
.lxv-cbtn.yes{background:linear-gradient(135deg,#12A15C,#1FBF7A);color:#fff;box-shadow:0 16px 30px -16px rgba(18,161,92,.95)}
.lxv-cbtn.yes:hover{transform:translateY(-2px)}
.lxv-cbtn.show{background:#fff;color:var(--ink);border:1.5px solid var(--line);width:100%}
.lxv-cbtn.show:hover{border-color:var(--fire);color:var(--fire)}
.lxv-done{text-align:center;padding:36px 20px;border-radius:26px;background:linear-gradient(160deg,#12261F,#1C1236);color:#fff;box-shadow:0 34px 64px -44px rgba(27,18,51,.95);animation:lxv-pop .5s cubic-bezier(.3,1.4,.5,1) both}
@keyframes lxv-pop{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}
.lxv-done .em{font-size:46px}
.lxv-done h2{font:800 24px var(--display);margin:12px 0 6px}
.lxv-done p{color:rgba(255,255,255,.78);font-size:14px}
.lxv-done .stats{display:flex;gap:18px;justify-content:center;margin:16px 0}
.lxv-done .stats b{font:800 24px var(--display);display:block}
.lxv-done .stats small{color:rgba(255,255,255,.6);font-size:12px}
.lxv-cta{margin-top:18px;text-align:center}
`;
    document.head.appendChild(s);
  }

  /* ---------- рендер ---------- */
  function render(el) {
    if (!el) return;
    injectCss();
    if (!(w.Lexy.user && w.Lexy.user.premium)) { renderLock(el); return; }
    renderMain(el);
  }

  function renderLock(el) {
    var t = T();
    el.innerHTML = '<div class="lxv-hero"><div class="row"><span class="lxv-mascot">' + flame(38) + '</span><div><h2>' + t.title + '</h2><p>' + t.sub + '</p></div></div>' +
      '<div class="lxv-badges"><span class="lxv-badge">A1–C2</span><span class="lxv-badge">' + totalAll() + " " + t.words + '</span><span class="lxv-badge">SRS</span></div></div>' +
      '<div class="card" style="text-align:center"><div style="font-size:40px">🔒</div><h2 style="font:800 22px var(--display);margin:10px 0">' + t.locked + '</h2>' +
      '<p class="s">' + t.lockBody + '</p><a class="btn p" href="pricing.html" style="margin-top:14px">' + ic("spark") + " " + t.getPrem + "</a></div>";
  }

  function ringHtml(pct) {
    var r = 32, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
    return '<div class="lxv-ring"><svg viewBox="0 0 78 78"><circle class="bg" cx="39" cy="39" r="' + r + '"/><circle class="fg" cx="39" cy="39" r="' + r + '" style="stroke-dasharray:' + c.toFixed(1) + ";stroke-dashoffset:" + off.toFixed(1) + '"/></svg><b>' + pct + "%</b></div>";
  }

  function rowHtml(o) {
    var t = T(), b = stOf(o.w).b, cls = b >= KNOWN_BOX ? "k" : b > 0 ? "l" : "n";
    var lbl = b >= KNOWN_BOX ? t.known : b > 0 ? t.review + " " + b + "/5" : t.fresh;
    return '<div class="lxv-row"><span class="spk" data-spk="' + esc(o.w) + '" title="' + t.speak + '">' + ic("head") + "</span>" +
      '<div class="tx"><b>' + esc(o.w) + "</b><small>" + esc(tr(o.d)) + "</small></div>" +
      '<span class="st ' + cls + '">' + lbl + "</span></div>";
  }

  function renderMain(el) {
    var t = T(), s = state(), lv = s.level, p = progress(lv), due = reviewCount(), acc = LV_ACCENT[lv];
    var hero = '<div class="lxv-hero"><div class="row"><span class="lxv-mascot">' + flame(38) + '</span><div><h2>' + t.title + '</h2><p>' + t.sub + '</p></div>' + ringHtml(p.pct) + '</div>' +
      '<div class="lxv-badges"><span class="lxv-badge" style="background:' + acc + '33;border-color:' + acc + '66">' + t.level + " " + lv + "</span>" +
      '<span class="lxv-badge">' + lvName(lv) + '</span><span class="lxv-badge">' + p.known + " / " + p.total + " " + t.words + "</span></div>" +
      '<div class="lxv-actions"><button class="lxv-btn p" id="lxvStudy">' + ic("play") + " " + t.learn + "</button>" +
      '<button class="lxv-btn g" id="lxvReview">' + ic("hist") + " " + t.review + (due ? " <em>" + due + "</em>" : "") + "</button></div></div>";

    var stats = '<div class="lxv-stats">' +
      '<div class="lxv-stat" style="--ac:#12A15C"><b>' + p.known + '</b><small>' + t.known + '</small></div>' +
      '<div class="lxv-stat" style="--ac:#F2B100"><b>' + p.learning + '</b><small>' + t.learning + '</small></div>' +
      '<div class="lxv-stat" style="--ac:#7A40FF"><b>' + p.fresh + '</b><small>' + t.fresh + '</small></div></div>';

    var chips = LEVELS.map(function (l) {
      var c = byLevel(l).length, a = LV_ACCENT[l], on = l === lv;
      return '<button class="lxv-lchip' + (on ? " on" : "") + '" data-lv="' + l + '"' + (on ? ' style="background:' + a + '"' : "") + ">" + l + " <em>" + c + "</em></button>";
    }).join("");

    var search = '<div class="lxv-search" id="lxvSearchBox"><span class="si">' + ic("search") + '</span><input id="lxvQ" placeholder="' + t.search + '" autocomplete="off"><button class="lxv-clr" id="lxvClr" aria-label="clear">' + ic("x") + "</button></div>";

    var add = '<div class="lxv-add"><b>' + ic("plus") + " " + t.addT + '</b><div class="f"><input id="lxvAddW" placeholder="' + t.wordPh + '"><input id="lxvAddT" placeholder="' + t.transPh + '"><button id="lxvAdd">' + ic("plus") + " " + t.add + "</button></div></div>";

    el.innerHTML = hero + stats + '<div class="lxv-levels" id="lxvLevels">' + chips + "</div>" + search + '<div class="lxv-results" id="lxvResults"></div>' + add;

    el.querySelectorAll("[data-lv]").forEach(function (b) {
      b.addEventListener("click", function () { var v = state(); v.level = b.dataset.lv; v.manual = true; saveVocab(); renderMain(el); });
    });
    $("#lxvStudy", el).addEventListener("click", function () { startSession(el, sessionQueue(lv)); });
    $("#lxvReview", el).addEventListener("click", function () {
      var q = dueWords();
      if (!q.length) { toast(t.revNone); return; }
      startSession(el, q);
    });

    var box = $("#lxvSearchBox", el), q = $("#lxvQ", el);
    function drawQ() {
      var v = q.value;
      box.classList.toggle("has", !!v);
      $("#lxvResults", el).innerHTML = resultsHtml(lv, v);
      el.querySelectorAll("[data-spk]").forEach(function (b) { b.addEventListener("click", function () { speak(b.dataset.spk); }); });
    }
    q.addEventListener("input", drawQ);
    $("#lxvClr", el).addEventListener("click", function () { q.value = ""; drawQ(); q.focus(); });
    drawQ();

    $("#lxvAdd", el).addEventListener("click", function () {
      var wv = $("#lxvAddW", el).value.trim(), tv = $("#lxvAddT", el).value.trim();
      if (!wv) { toast(t.toast1); return; }
      addCustom(lv, wv, tv);
      toast(t.added + wv);
      renderMain(el);
    });
  }

  function resultsHtml(lv, query) {
    var t = T(), q = (query || "").trim().toLowerCase();
    var all = byLevel(lv);
    if (!q) {
      return '<div class="lxv-hint"><div class="lxv-mascot">' + flame(28) + "</div>" + t.hint + "<br><b>" + all.length + " " + t.lvWords + "</b></div>";
    }
    var res = all.filter(function (o) { return (o.w + " " + tr(o.d)).toLowerCase().indexOf(q) > -1; });
    if (!res.length) return '<div class="lxv-hint">' + t.notFound + "</div>";
    return res.slice(0, 80).map(rowHtml).join("");
  }

  function sessionQueue(lv) {
    var seen = {}, inProg = [], fresh = [];
    byLevel(lv || state().level).forEach(function (o) {
      if (seen[o.w]) return; seen[o.w] = 1;
      var b = stOf(o.w).b;
      if (b > 0 && b < KNOWN_BOX) inProg.push(o); else if (b === 0) fresh.push(o);
    });
    return inProg.concat(fresh);
  }

  function startSession(el, queue) {
    if (!queue.length) { toast(T().revNone); return; }
    el._sess = { queue: queue, i: 0, shown: false, knew: 0, total: 0 };
    drawSession(el);
  }

  function drawSession(el) {
    var t = T(), se = el._sess;
    if (se.i >= se.queue.length) { drawDone(el, se); return; }
    var o = se.queue[se.i], b = stOf(o.w).b;
    var kind = b >= KNOWN_BOX ? t.knowLbl : b ? t.revLbl + " " + b + "/5" : t.newLbl;
    var pct = Math.round(se.i / se.queue.length * 100);
    el.innerHTML = '<div class="lxv-sess">' +
      '<div class="top"><span class="lv" style="color:' + LV_ACCENT[o.lv] + '">' + o.lv + " · " + lvName(o.lv) + '</span><span class="cnt">' + (se.i + 1) + " " + t.of + " " + se.queue.length + "</span></div>" +
      '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="lxv-card"><div class="inner">' +
      '<div class="kind">' + esc(kind) + '</div>' +
      '<div class="w">' + esc(o.w) + '<button class="spk" data-spk="' + esc(o.w) + '">' + ic("head") + "</button></div>" +
      '<div class="tr' + (se.shown ? " on" : "") + '">' + (se.shown ? esc(tr(o.d)) : "") + "</div>" +
      '<div class="lxv-cbtns">' +
      (se.shown
        ? '<button class="lxv-cbtn no" id="lxvNo">' + t.dont + '</button><button class="lxv-cbtn yes" id="lxvYes">' + t.know + "</button>"
        : '<button class="lxv-cbtn show" id="lxvShow">' + t.show + "</button>") +
      "</div></div></div>" +
      '<div class="lxv-cta"><button class="lnk" id="lxvQuit">' + t.finish + "</button></div></div>";

    el.querySelectorAll("[data-spk]").forEach(function (x) { x.addEventListener("click", function () { speak(x.dataset.spk); }); });
    if (se.shown) {
      $("#lxvNo", el).addEventListener("click", function () { afterAnswer(el, o.w, false); });
      $("#lxvYes", el).addEventListener("click", function () { afterAnswer(el, o.w, true); });
    } else {
      $("#lxvShow", el).addEventListener("click", function () { se.shown = true; drawSession(el); });
    }
    $("#lxvQuit", el).addEventListener("click", function () { se.i = se.queue.length; drawSession(el); });
  }

  function afterAnswer(el, word, knew) {
    answer(word, knew);
    var se = el._sess;
    if (knew) se.knew++; else se.total++;
    se.i++; se.shown = false;
    drawSession(el);
  }

  function drawDone(el, se) {
    var t = T();
    el.innerHTML = '<div class="lxv-sess"><div class="lxv-done"><div class="em">🎉</div>' +
      "<h2>" + t.done + "</h2>" +
      '<div class="stats"><div><b style="color:#39D98A">' + se.knew + "</b><small>" + t.known + "</small></div>" +
      '<div><b style="color:#FF8A6A">' + se.total + "</b><small>" + t.dont + "</small></div>" +
      '<div><b>' + se.queue.length + "</b><small>" + t.words + "</small></div></div>" +
      '<button class="lxv-btn p" id="lxvBack" style="background:#fff;color:#12261F">' + ic("chev") + " " + t.back + "</button></div></div>";
    try { w.Lexy.addMin(3); } catch (e) {}
    $("#lxvBack", el).addEventListener("click", function () { el._sess = null; renderMain(el); });
  }

  w.LexyVocab = {
    WORDS: WORDS, LEVELS: LEVELS,
    render: render,
    dueCount: reviewCount,
    total: totalAll,
    answer: answer
  };
})(window);
