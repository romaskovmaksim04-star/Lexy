/* ==========================================================
   lexy-core.js — общее ядро кабинета Lexy
   • «База данных» (DB) — единый слой хранения. Сейчас это localStorage,
     общий для обоих HTML-файлов (одно происхождение/домен).
     Чтобы подключить настоящую БД, замени 4 функции в объекте DB
     (all/load/save/remove) на запросы к своему серверу.
   • Маршрутизация профилей: user.path = "english" | "ielts"
   • Сайдбар, профиль, словарь, замки Premium, модалки, тосты
   ========================================================== */
(function (w) {
"use strict";

/* ---------- настройки ---------- */
var CFG = Object.assign({
  demo: false,             // показывать кнопку «включить Premium (демо)» в профиле
  requireAuth: true,       // true = без сессии отправлять на login.html
  login: "login.html", pricing: "pricing.html", home: "main.html",
  privacy: "privacy.html", terms: "terms.html", test: "test.html",
  support: "lexisupportapp@gmail.com", tg: "https://t.me/LexiEnglishWorld",
  pages: { english: "dashboard-english.html", ielts: "dashboard-ielts.html" }
}, w.LEXY_CONFIG || {});

var KEY = "lexy_db_v1", SES = "lexy_session";
var U = null, PROF = null, CUR = null, MOK = null, MLOCK = false, REDIR = false, GATED = false;
var NOTIF = [];
var H = {}, A = {};

var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

/* ---------- БАЗА ДАННЫХ ---------- */
var DB = {
  all: function () { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } },
  load: function (email) { return DB.all()[email] || null; },
  save: function (u) { var a = DB.all(); a[u.email] = u; localStorage.setItem(KEY, JSON.stringify(a)); },
  remove: function (email) { var a = DB.all(); delete a[email]; localStorage.setItem(KEY, JSON.stringify(a)); }
};

function iso(d) { d = d || new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
function fresh(email) {
  return { email: email, name: "", path: null, onboard: null, premium: false, examDate: iso(), target: 7.5,
    lang: "ru", news: true, created: Date.now(), streak: [], mins: {}, lessons: {}, phrases: 0,
    words: [], decks: [], tests: {}, dismiss: {}, vsort: false };
}
function authUser() {
  try { return w.LexyAuth ? w.LexyAuth.user() : null; } catch (e) { return null; }
}
function session() {
  var au = authUser();
  if (au && au.email) {
    try { localStorage.setItem(SES, au.email); } catch (e) {}
    return au.email;
  }
  if (CFG.requireAuth) { REDIR = true; location.replace(CFG.login); return null; }
  return "demo@lexy.app";
}
function load() {
  var m = session(); if (!m) return null;
  var au = authUser();
  U = Object.assign(fresh(m), DB.load(m) || {});
  if (au) {
    if (au.name) U.name = au.name;
    if (au.path) U.path = au.path;
    U.plan = au.plan || "free";
    U.planExpires = au.planExpires || null;
    U.premium = !!au.premium;
    if (au.target != null) U.target = Number(au.target);
    if (au.examDate) U.examDate = au.examDate;
    if (au.lang) U.lang = au.lang;
    if (au.survey) U.survey = au.survey;
  }
  /* язык: общий для всего сайта (localStorage 'lang' ↔ профиль) */
  try {
    var gl = w.localStorage.getItem("lang");
    if (gl && ["en", "ru", "kz", "uz"].indexOf(gl) > -1) {
      U.lang = gl;
      if (au && au.lang !== gl) { try { w.LexyAuth.update({ lang: gl }); } catch (e) {} }
    } else {
      w.localStorage.setItem("lang", U.lang);
    }
  } catch (e) {}
  var t = iso();
  if (U.streak.indexOf(t) < 0) { U.streak.push(t); U.streak = U.streak.slice(-400); }
  DB.save(U);
  if (w.LexyAuth) { try { w.LexyAuth.update({ settings: { app: snapshot() } }); } catch (e) {} }
  return U;
}
var SYNC_KEYS = ["onboard", "course", "vocab", "tests", "mins", "streak", "words", "decks", "lessons", "phrases", "dismiss", "vsort", "news"];
function snapshot() { var s = {}; SYNC_KEYS.forEach(function (k) { if (U[k] !== undefined) s[k] = U[k]; }); return s; }
function save(p) {
  if (p) Object.assign(U, p);
  DB.save(U);
  if (w.LexyAuth) {
    var patch = Object.assign({}, p || {}, { settings: { app: snapshot() } });
    try { w.LexyAuth.update(patch); } catch (e) {}
  }
}

/* статистика */
function streakN() { var n = 0, d = new Date(); while (U.streak.indexOf(iso(d)) > -1) { n++; d.setDate(d.getDate() - 1); } return n; }
function weekDots() {
  var d = new Date(), dow = (d.getDay() + 6) % 7, r = [];
  for (var i = 0; i < 7; i++) { var x = new Date(d); x.setDate(d.getDate() - dow + i); r.push({ on: U.streak.indexOf(iso(x)) > -1, today: i === dow }); }
  return r;
}
function addMin(n) { var t = iso(); U.mins[t] = (U.mins[t] || 0) + n; save(); }
function minsStat() {
  var t = iso(), now = new Date(), day = 0, wk = 0, all = 0;
  Object.keys(U.mins).forEach(function (k) {
    var v = U.mins[k], dd = new Date(k + "T00:00:00"); all += v;
    if (k === t) day = v; if (dd <= now && (now - dd) / 864e5 < 7) wk += v;
  });
  return { day: day, wk: wk, all: all };
}

/* ---------- иконки ---------- */
var IC = {
  home: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  vocab: '<path d="M4 5h8M8 3v2M5 9c1.500 3 4 5 7 6M11 9c-1 3-3 5-6 7M13 21l4-10 4 10M14.500 18h5"/>',
  spark: '<path d="M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800zM19 16l.8 2.200L22 19l-2.200.8L19 22l-.8-2.200L16 19l2.200-.8z"/>',
  game: '<rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 10v5M4.500 12.500h5M16 12h.01M18.500 14h.01"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  talk: '<path d="M21 12a8 8 0 0 1-11.600 7.100L4 20l1-4.600A8 8 0 1 1 21 12z"/><path d="M8.500 12h.01M12 12h.01M15.500 12h.01"/>',
  play: '<path d="M8 5v14l11-7z" fill="currentColor"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  head: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="2" y="14" width="5" height="7" rx="2"/><rect x="17" y="14" width="5" height="7" rx="2"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
  star: '<path d="M12 3l2.700 5.600 6.100.9-4.400 4.300 1 6.100-5.400-2.900-5.400 2.900 1-6.100L3.200 9.500l6.100-.9z"/>',
  hist: '<path d="M3 12a9 9 0 1 0 3-6.700L3 8M3 3v5h5M12 7v5l3 2"/>',
  chev: '<path d="M9 6l6 6-6 6"/>', down: '<path d="M6 9l6 6 6-6"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 8l9 6 9-6"/>',
  crown: '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.400 8-8 9-4.600-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  logout: '<path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M16 8l4 4-4 4M20 12H9"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  sort: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  send: '<path d="M21 3L3 11l7 3 3 7z"/><path d="M10 14l11-11"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  swap: '<path d="M16 4l4 4-4 4M20 8H8M8 20l-4-4 4-4M4 16h12"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  fire: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',
  clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 3h6"/>'
};
function sprite() {
  var s = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="lg" x1=".2" y1="1" x2=".8" y2="0"><stop offset="0" stop-color="#FF4E1A"/><stop offset="1" stop-color="#FF9A0A"/></linearGradient></defs>' +
    '<symbol id="flame" viewBox="0 0 100 120"><path fill="url(#lg)" d="M42 3C54 6 66 15 70 28c2 7 1 14-2 21 5-1 8-7 8-14 7 5 12 14 12 25 7 8 10 18 10 28 0 17-20 28-46 28C21 117 2 105 2 87c0-17 12-31 26-41 10-8 16-17 14-43z"/><rect x="17" y="64" width="66" height="30" rx="15" fill="#fff"/><ellipse cx="34" cy="79" rx="4" ry="6" fill="#151515"/><ellipse cx="66" cy="79" rx="4" ry="6" fill="#151515"/><path d="M43.500 78h13c-.5 6-4 10-6.500 10s-6-4-6.500-10z" fill="#151515"/></symbol>';
  for (var k in IC) s += '<symbol id="i-' + k + '" viewBox="0 0 24 24">' + IC[k] + "</symbol>";
  return s + "</svg>";
}
function ic(n, c) { return '<svg class="i' + (c ? " " + c : "") + '"><use href="#i-' + n + '"/></svg>'; }
function fl(h) { return '<svg class="f" viewBox="0 0 100 120" style="width:' + Math.round(h * 0.83) + "px;height:" + h + 'px"><use href="#flame"/></svg>'; }

/* ---------- подписи меню (RU / EN / UZ) ---------- */
var LAB = {
  ru: { path: "Путь", practice: "Задания", faq: "Вопросы", talk: "Разговор", vocab: "Словарь", progress: "Прогресс", home: "Главная", tests: "Тесты", stats: "Статистика", ai: "Lexy AI", games: "Игры", profile: "Личный кабинет", prem: "Получить Premium" },
  en: { path: "Path", practice: "Practice", faq: "FAQ", talk: "Talk", vocab: "Vocabulary", progress: "Progress", home: "Home", tests: "Tests", stats: "Statistics", ai: "Lexy AI", games: "Games", profile: "My account", prem: "Get Premium" },
  kz: { path: "Жол", practice: "Тапсырмалар", faq: "Сұрақтар", talk: "Сөйлесу", vocab: "Сөздік", progress: "Прогресс", home: "Басты бет", tests: "Тесттер", stats: "Статистика", ai: "Lexy AI", games: "Ойындар", profile: "Жеке кабинет", prem: "Premium алу" },
  uz: { path: "Yo‘l", practice: "Topshiriqlar", faq: "Savollar", talk: "Suhbat", vocab: "Lug‘at", progress: "Taraqqiyot", home: "Bosh sahifa", tests: "Testlar", stats: "Statistika", ai: "Lexy AI", games: "O‘yinlar", profile: "Kabinet", prem: "Premium olish" }
};
/* [id раздела, иконка, ключ замка]. Замок показывается, пока нет Premium */
var NAV = {
  english: [["path", "map"], ["practice", "file"], ["talk", "talk", "ai"], ["vocab", "vocab", "ai"], ["progress", "home", "ai"]],
  ielts: [["home", "home"], ["tests", "file"], ["stats", "trend"], ["vocab", "vocab", "ai"], ["ai", "spark", "ai"], ["games", "game", "games"]]
};
function L() { return LAB[U.lang] || LAB.ru; }
var PL = {
  ru: { acc: "ТВОЙ АККАУНТ", none: "Не указано", premium: "Premium", freePlan: "Бесплатный план", profile: "Профиль", name: "Имя", editName: "Изменить имя", email: "Email", emailNote: "Используется для входа, изменить нельзя", news: "Рассылка по email", newsNote: "Получать советы и напоминания", settings: "Настройки", language: "Язык", usage: "Для чего ты используешь Lexy", usageNote: "Приложение подстроится под выбор: главная, меню и Lexy AI.", pathEn: "Разговорный английский", pathEnSub: "Уроки-разговоры с Lexy, слова и фразы", pathIe: "Подготовка к IELTS", pathIeSub: "Пробные экзамены, баллы и план до экзамена", support: "Поддержка", privacy: "Политика конфиденциальности", terms: "Условия пользования", subscription: "Подписка", active: "Активна", noSub: "Нет подписки", premDesc: "Premium открывает Lexy AI, словарь и игры.", choosePlan: "Выбрать тариф", guarantee: "Гарантия возврата", guaranteeText: "Двойная гарантия: не набрал нужный балл — вернём деньги или оплатим пересдачу. Условия уточняй в поддержке.", logout: "Выйти", created: "Аккаунт создан", delTitle: "Удаление аккаунта", delText: "Доступ закроется сразу, аккаунт и данные удалим через 30 дней. Восстановить — только через поддержку.", delBtn: "Удалить аккаунт", premiumActive: "Premium активен" },
  en: { acc: "YOUR ACCOUNT", none: "Not set", premium: "Premium", freePlan: "Free plan", profile: "Profile", name: "Name", editName: "Edit name", email: "Email", emailNote: "Used for login, cannot be changed", news: "Email newsletter", newsNote: "Receive tips and reminders", settings: "Settings", language: "Language", usage: "What you use Lexy for", usageNote: "The app adapts to your choice: home, menu and Lexy AI.", pathEn: "Conversational English", pathEnSub: "Talk lessons with Lexy, words and phrases", pathIe: "IELTS preparation", pathIeSub: "Mock exams, scores and a plan until the exam", support: "Support", privacy: "Privacy Policy", terms: "Terms of Use", subscription: "Subscription", active: "Active", noSub: "No subscription", premDesc: "Premium unlocks Lexy AI, vocabulary and games.", choosePlan: "Choose a plan", guarantee: "Money-back guarantee", guaranteeText: "Double guarantee: if you don't reach the score — we refund or pay for a retake. Terms are in support.", logout: "Log out", created: "Account created", delTitle: "Delete account", delText: "Access closes immediately; we delete the account and data in 30 days. Only support can restore it.", delBtn: "Delete account", premiumActive: "Premium active" },
  kz: { acc: "СЕНІҢ АККАУНТЫҢ", none: "Көрсетілмеген", premium: "Premium", freePlan: "Тегін жоспар", profile: "Профиль", name: "Аты", editName: "Атын өзгерту", email: "Email", emailNote: "Кіру үшін қолданылады, өзгертуге болмайды", news: "Email хабарлама", newsNote: "Кеңестер мен еске салғыштар алу", settings: "Параметрлер", language: "Тіл", usage: "Lexy-ді не үшін қолданасың", usageNote: "Қолданба таңдауыңа бейімделеді: басты бет, мәзір және Lexy AI.", pathEn: "Сөйлесу ағылшын тілі", pathEnSub: "Lexy-мен сөйлесу сабақтары, сөздер мен фразалар", pathIe: "IELTS-ке дайындық", pathIeSub: "Сынақ емтихандар, балдар және емтиханға дейінгі жоспар", support: "Қолдау", privacy: "Құпиялылық саясаты", terms: "Пайдалану шарттары", subscription: "Жазылым", active: "Белсенді", noSub: "Жазылым жоқ", premDesc: "Premium Lexy AI, сөздік және ойындарды ашады.", choosePlan: "Тариф таңдау", guarantee: "Ақшаны қайтару кепілдігі", guaranteeText: "Қос кепілдік: керекті баллды жинамасаң — ақшаңды қайтарамыз немесе қайта тапсыруды төлейміз. Шарттары қолдау қызметінде.", logout: "Шығу", created: "Аккаунт жасалды", delTitle: "Аккаунтты жою", delText: "Қолжетімділік бірден жабылады, аккаунт пен деректерді 30 күнде жоямыз. Тек қолдау арқылы қалпына келтіруге болады.", delBtn: "Аккаунтты жою", premiumActive: "Premium белсенді" },
  uz: { acc: "SIZNING AKKAUNTINGIZ", none: "Ko'rsatilmagan", premium: "Premium", freePlan: "Bepul reja", profile: "Profil", name: "Ism", editName: "Ismni o'zgartirish", email: "Email", emailNote: "Kirish uchun ishlatiladi, o'zgartirib bo'lmaydi", news: "Email xabarnoma", newsNote: "Maslahat va eslatmalar olish", settings: "Sozlamalar", language: "Til", usage: "Lexydan nima uchun foydalanasiz", usageNote: "Ilova tanlovingizga moslashadi: bosh sahifa, menyu va Lexy AI.", pathEn: "So'zlashuv ingliz tili", pathEnSub: "Lexy bilan suhbat darslari, so'zlar va iboralar", pathIe: "IELTSga tayyorgarlik", pathIeSub: "Sinov imtihonlari, ballar va imtihongacha reja", support: "Qo'llab-quvvatlash", privacy: "Maxfiylik siyosati", terms: "Foydalanish shartlari", subscription: "Obuna", active: "Faol", noSub: "Obuna yo'q", premDesc: "Premium Lexy AI, lug'at va o'yinlarni ochadi.", choosePlan: "Tarif tanlash", guarantee: "Pulni qaytarish kafolati", guaranteeText: "Qo'sh kafolat: kerakli ballni to'plamasangiz — pulni qaytaramiz yoki qayta topshirishni to'laymiz. Shartlar qo'llab-quvvatlashda.", logout: "Chiqish", created: "Akkaunt yaratildi", delTitle: "Akkauntni o'chirish", delText: "Kirish darhol yopiladi, akkaunt va ma'lumotlarni 30 kunda o'chiramiz. Faqat qo'llab-quvvatlash orqali tiklash mumkin.", delBtn: "Akkauntni o'chirish", premiumActive: "Premium faol" }
};
function P() { return PL[U.lang] || PL.ru; }
var DL = { ru: "ru-RU", en: "en-GB", kz: "kk-KZ", uz: "uz-UZ" };
var MOD = {
  ru: { nameQ: "Как тебя зовут?", nameLbl: "Имя", save: "Сохранить", cancel: "Отмена", nameSaved: "Имя сохранено", delQ: "Удалить аккаунт?", delQText: "Аккаунт и подписка удалятся сразу. Это действие нельзя отменить.", delYes: "Удалить" },
  en: { nameQ: "What's your name?", nameLbl: "Name", save: "Save", cancel: "Cancel", nameSaved: "Name saved", delQ: "Delete account?", delQText: "The account and subscription will be removed immediately. This cannot be undone.", delYes: "Delete" },
  kz: { nameQ: "Атың кім?", nameLbl: "Аты", save: "Сақтау", cancel: "Болдырмау", nameSaved: "Аты сақталды", delQ: "Аккаунтты жою?", delQText: "Аккаунт пен жазылым бірден жойылады. Бұл әрекетті қайтару мүмкін емес.", delYes: "Жою" },
  uz: { nameQ: "Ismingiz nima?", nameLbl: "Ism", save: "Saqlash", cancel: "Bekor qilish", nameSaved: "Ism saqlandi", delQ: "Akkauntni o'chirish?", delQText: "Akkaunt va obuna darhol o'chiriladi. Bu amalni qaytarib bo'lmaydi.", delYes: "O'chirish" }
};
function M() { return MOD[U.lang] || MOD.ru; }

/* ---------- прочие подписи (RU/EN/KZ/UZ) ---------- */
var CO = {
  ru: { androidT: "Lexy скоро на Android", androidS: "Приложение появится в Google Play", tgT: "Наш Telegram-канал", tgS: "Лайфхаки и разборы ошибок", close: "Закрыть",
    premTitle: "Доступно в Premium", premVocab: "Словарь с карточками и наборами слов", premAi: "Lexy AI — разговоры с ИИ", premGames: "Игры для тренировки под давлением", thisFeature: "Эта функция", premOpens: "открывается в Premium.", getPrem: "Получить Premium", later: "Позже",
    gateAiT: "Lexy AI — премиум-функция", gateAiP: "Практикуй живую речь с ИИ-собеседником. Оформи премиум, чтобы открыть безлимитные разговоры.", gateGamesT: "Игры — премиум-функция", gateGamesP: "Играй в Shadow Speak и Connector Rush и тренируй английский под давлением. Оформи премиум, чтобы открыть игры.", getPremFull: "Получить премиум",
    chooserT: "Выбери свой путь", chooserBody: "Мы настроим кабинет под твои цели. Потом это можно изменить в личном кабинете.", profChosen: "Профиль выбран",
    newsOn: "Рассылка включена", newsOff: "Рассылка выключена", demoOn: "Premium включён (демо)", demoOff: "Premium выключен", delFail: "Не получилось удалить аккаунт. Попробуй ещё раз.", delBtn: "Удалить" },
  en: { androidT: "Lexy is coming to Android", androidS: "The app will appear on Google Play", tgT: "Our Telegram channel", tgS: "Tips and error breakdowns", close: "Close",
    premTitle: "Available in Premium", premVocab: "Vocabulary with flashcards and word decks", premAi: "Lexy AI — conversations with AI", premGames: "Games to train under pressure", thisFeature: "This feature", premOpens: "unlocks in Premium.", getPrem: "Get Premium", later: "Later",
    gateAiT: "Lexy AI — a premium feature", gateAiP: "Practise live speech with an AI partner. Get premium to unlock unlimited conversations.", gateGamesT: "Games — a premium feature", gateGamesP: "Play Shadow Speak and Connector Rush and train English under pressure. Get premium to unlock games.", getPremFull: "Get premium",
    chooserT: "Choose your path", chooserBody: "We'll set up your account around your goals. You can change this later in your profile.", profChosen: "Path selected",
    newsOn: "Newsletter on", newsOff: "Newsletter off", demoOn: "Premium enabled (demo)", demoOff: "Premium disabled", delFail: "Couldn't delete the account. Try again.", delBtn: "Delete" },
  kz: { androidT: "Lexy жақында Android-та", androidS: "Қолданба Google Play-де шығады", tgT: "Біздің Telegram-канал", tgS: "Лайфхактар мен қате талдау", close: "Жабу",
    premTitle: "Premium-да қолжетімді", premVocab: "Карточкалар мен сөз жинақтары бар сөздік", premAi: "Lexy AI — ИИ-мен сөйлесу", premGames: "Қысым астында жаттығуға арналған ойындар", thisFeature: "Бұл функция", premOpens: "Premium-да ашылады.", getPrem: "Premium алу", later: "Кейінірек",
    gateAiT: "Lexy AI — премиум-функция", gateAiP: "ИИ-әңгімелесушімен тірі сөйлеуді жаттық. Шексіз сөйлесу үшін премиум ал.", gateGamesT: "Ойындар — премиум-функция", gateGamesP: "Shadow Speak және Connector Rush ойнап, қысым астында ағылшынды жаттық. Ойындар үшін премиум ал.", getPremFull: "Премиум алу",
    chooserT: "Өз жолыңды таңда", chooserBody: "Кабинетті мақсатыңа қарай баптаймыз. Кейін жеке кабинетте өзгертуге болады.", profChosen: "Профиль таңдалды",
    newsOn: "Хабарлама қосылды", newsOff: "Хабарлама өшірілді", demoOn: "Premium қосылды (демо)", demoOff: "Premium өшірілді", delFail: "Аккаунт жойылмады. Қайталап көр.", delBtn: "Жою" },
  uz: { androidT: "Lexy tez orada Android'da", androidS: "Ilova Google Play'da paydo bo'ladi", tgT: "Bizning Telegram kanal", tgS: "Maslahatlar va xato tahlili", close: "Yopish",
    premTitle: "Premium'da mavjud", premVocab: "Kartochkalar va so'z to'plamlari bilan lug'at", premAi: "Lexy AI — AI bilan suhbat", premGames: "Bosim ostida mashq uchun o'yinlar", thisFeature: "Bu funksiya", premOpens: "Premium'da ochiladi.", getPrem: "Premium olish", later: "Keyinroq",
    gateAiT: "Lexy AI — premium funksiya", gateAiP: "AI suhbatdosh bilan jonli nutqni mashq qiling. Cheksiz suhbat uchun premium oling.", gateGamesT: "O'yinlar — premium funksiya", gateGamesP: "Shadow Speak va Connector Rush o'ynab, bosim ostida ingliz tilini mashq qiling. O'yinlar uchun premium oling.", getPremFull: "Premium olish",
    chooserT: "Yo'lingizni tanlang", chooserBody: "Kabinetni maqsadlaringizga moslaymiz. Keyin profilda o'zgartirish mumkin.", profChosen: "Profil tanlandi",
    newsOn: "Xabarnoma yoqildi", newsOff: "Xabarnoma o'chirildi", demoOn: "Premium yoqildi (demo)", demoOff: "Premium o'chirildi", delFail: "Akkaunt o'chirilmadi. Qayta urinib ko'ring.", delBtn: "O'chirish" }
};
function C() { return CO[U.lang] || CO.ru; }
var RENEW = { ru: "Продлить тариф", en: "Extend plan", kz: "Тарифті ұзарту", uz: "Tarifni uzaytirish" };
function renewT() { return RENEW[U.lang] || RENEW.ru; }

/* ---------- модалка / тост ---------- */
function modal(o) {
  var m = $("#mv");
  var foot = o.foot !== undefined ? (o.foot === false ? "" : '<div class="mf">' + o.foot + "</div>")
    : '<div class="mf">' + (o.cancel ? '<button class="btn g" data-act="mclose">' + o.cancel + "</button>" : "") + (o.ok ? '<button class="btn p" data-act="mok">' + o.ok + "</button>" : "") + "</div>";
  m.innerHTML = '<div class="mb">' + (o.title ? "<h2>" + o.title + "</h2>" : "") + (o.body || "") + foot + "</div>";
  m.classList.add("on"); MOK = o.onOk || null; MLOCK = !!o.lock;
  if (o.init) o.init(m);
}
function closeM() { $("#mv").classList.remove("on"); MOK = null; MLOCK = false; }
var TT;
function toast(t) { var e = $("#toast"); e.textContent = t; e.classList.add("on"); clearTimeout(TT); TT = setTimeout(function () { e.classList.remove("on"); }, 2600); }
function upsell(f) {
  var co = C();
  var T = { vocab: co.premVocab, ai: co.premAi, games: co.premGames };
  modal({ title: co.premTitle, body: "<p>" + (T[f] || co.thisFeature) + " " + co.premOpens + "</p>", ok: co.getPrem, cancel: co.later, onOk: function () { location.href = CFG.pricing; return false; } });
}

/* ---------- замки Premium ---------- */
function LOCKS() {
  var co = C();
  return {
    ai: { ic: "mic", t: co.gateAiT, p: co.gateAiP, c: "v" },
    games: { ic: "game", t: co.gateGamesT, p: co.gateGamesP, c: "" }
  };
}
function gates() {
  var LK = LOCKS(), co = C();
  $$("[data-gate]").forEach(function (e) {
    var k = LK[e.dataset.gate];
    e.hidden = U.premium;
    e.innerHTML = U.premium ? "" : '<div class="lks"><div class="lki ' + k.c + '">' + ic(k.ic) + "</div><h2>" + k.t + "</h2><p>" + k.p + '</p><a class="btn ' + (k.c ? "v" : "p") + '" href="' + CFG.pricing + '">' + ic("spark") + " " + co.getPremFull + "</a></div>";
  });
  $$("[data-pro]").forEach(function (e) { e.hidden = !U.premium; });
}

/* ---------- уведомления из админки ---------- */
function loadNotifs() {
  if (!w.LexyAuth || !w.LexyAuth.client) return;
  try {
    w.LexyAuth.client().rpc("lexy_notifications").then(function (res) {
      if (res && !res.error && res.data) { NOTIF = res.data; side(); }
    }).catch(function () {});
  } catch (e) {}
}

/* ---------- сайдбар ---------- */
function side() {
  var l = L(), h = '<a class="brand" href="dashboard.html">' + fl(31) + "Lexy</a><nav>";
  NAV[PROF].forEach(function (n) {
    h += '<a class="nv' + (CUR === n[0] ? " on" : "") + '" data-go="' + n[0] + '" href="#' + n[0] + '">' + ic(n[1]) + l[n[0]] + (n[2] && !U.premium ? ic("lock", "lk") : "") + "</a>";
  });
  h += '</nav><div class="bot">';
  var co = C();
  NOTIF.slice(0, 2).forEach(function (n) {
    h += '<div class="pr red"><span class="pi">' + ic("star") + '</span><div><b>' + esc(n.text) + "</b></div></div>";
  });
  if (!U.dismiss.tg) h += '<a class="pr wh" href="' + CFG.tg + '" target="_blank" rel="noopener"><button class="x" data-act="dismiss" data-k="tg" aria-label="' + co.close + '">×</button><span class="pi">' + ic("send") + "</span><div><b>" + co.tgT + "</b><small>" + co.tgS + "</small></div></a>";
  h += '<a class="nv' + (CUR === "profile" ? " on" : "") + '" data-go="profile" href="#profile">' + ic("user") + l.profile + "</a>";
  h += U.premium ? '<div class="prem" style="background:var(--ok)">' + ic("check") + " " + P().premiumActive + "</div>" : '<a class="prem" href="' + CFG.pricing + '">' + ic("spark") + l.prem + "</a>";
  $("#side").innerHTML = h + "</div>";
}

/* ---------- переключение разделов ---------- */
function show(id) {
  var ids = $$(".sec").map(function (s) { return s.id.slice(2); });
  if (ids.indexOf(id) < 0) id = ids[0];
  CUR = id;
  $$(".sec").forEach(function (s) { s.classList.toggle("on", s.id === "s-" + id); });
  side();
  if (id === "vocab") renderVocab();
  if (id === "profile") renderProfile();
  if (H[id]) H[id]();
  document.body.classList.remove("open");
  w.scrollTo(0, 0);
}

/* ---------- выбор профиля ---------- */
function chooser(lock) {
  var co = C(), t = P();
  modal({
    title: co.chooserT, lock: lock !== false, foot: false,
    body: "<p>" + co.chooserBody + "</p>" +
      '<div class="paths"><button data-act="pick" data-p="english"><span class="em">🗣</span><div><b>' + t.pathEn + "</b><small>" + t.pathEnSub + "</small></div></button>" +
      '<button data-act="pick" data-p="ielts"><span class="em">🎯</span><div><b>' + t.pathIe + "</b><small>" + t.pathIeSub + "</small></div></button></div>"
  });
}
function switchPath(p) {
  save({ path: p, settings: { app: snapshot() } });
  if (p === PROF) { closeM(); show(CUR); toast(C().profChosen); return; }
  var go = function () { location.href = CFG.pages[p]; };
  if (w.LexyAuth && w.LexyAuth.flush) { Promise.resolve(w.LexyAuth.flush()).then(go, go); }
  else go();
}

/* ---------- профиль (Личный кабинет) ---------- */
function pfCss() {
  if (document.getElementById("pf-css")) return;
  var s = document.createElement("style"); s.id = "pf-css";
  s.textContent = `
.pfhero{position:relative;overflow:hidden;border-radius:26px;padding:26px;margin-bottom:20px;background:linear-gradient(135deg,#2A1240 0%,#4B1E6B 48%,#7A2B3A 100%);color:#fff;box-shadow:0 30px 60px -40px rgba(43,18,64,.9);display:flex;align-items:center;gap:18px;animation:pf-in .5s cubic-bezier(.2,.8,.3,1) both}
.pfhero::after{content:"";position:absolute;inset:-40%;background:radial-gradient(circle at 18% 20%,rgba(255,154,10,.35),transparent 42%),radial-gradient(circle at 85% 82%,rgba(255,90,31,.35),transparent 46%);animation:pf-drift 15s ease-in-out infinite alternate;pointer-events:none}
@keyframes pf-drift{from{transform:translate3d(-6%,-4%,0) scale(1)}to{transform:translate3d(6%,4%,0) scale(1.14)}}
@keyframes pf-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.pfhero>*{position:relative;z-index:1}
.pfav{width:78px;height:78px;flex:none;border-radius:24px;display:grid;place-items:center;background:rgba(255,255,255,.12);backdrop-filter:blur(4px);box-shadow:inset 0 0 0 1px rgba(255,255,255,.2);animation:pf-float 4s ease-in-out infinite}
@keyframes pf-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.pfi{flex:1;min-width:0}
.pfi small{font:700 11px var(--display);letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.72)}
.pfi h2{font:800 26px var(--display);letter-spacing:-.03em;margin:5px 0 3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pfi p{margin:0;color:rgba(255,255,255,.82);font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pfbadges{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.pfbadge{font:600 12px var(--body);background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);padding:6px 12px;border-radius:999px;display:inline-flex;align-items:center;gap:6px}
.pfbadge.ok{background:rgba(57,217,138,.22);border-color:rgba(57,217,138,.5)}
.pfsec{margin-top:22px;animation:pf-in .5s cubic-bezier(.2,.8,.3,1) both}
.pfsec>h3{display:flex;align-items:center;gap:9px;font:800 14px var(--display);letter-spacing:.02em;color:var(--soft);text-transform:uppercase;margin:0 0 10px 4px}
.pfsec>h3 .si{width:28px;height:28px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(135deg,#FF5A1F,#FF9A0A);color:#fff;box-shadow:0 8px 16px -8px rgba(255,90,31,.9);animation:pf-icon .5s cubic-bezier(.3,1.4,.5,1) both}
@keyframes pf-icon{from{opacity:0;transform:scale(.5) rotate(-20deg)}to{opacity:1;transform:none}}
.pfcard{background:#fff;border:1.5px solid var(--line);border-radius:20px;overflow:hidden;box-shadow:0 18px 40px -34px rgba(27,20,51,.5)}
.pfrow{display:flex;align-items:center;gap:14px;padding:15px 18px;border-bottom:1px solid var(--line);animation:pf-row .45s cubic-bezier(.2,.8,.3,1) both}
.pfrow:last-child{border-bottom:0}
.pfrow.tap{cursor:pointer;transition:background .15s}
.pfrow.tap:hover{background:var(--mist)}
.pfrow .ic{width:44px;height:44px;flex:none;border-radius:14px;display:grid;place-items:center;background:var(--mist);color:var(--fire);animation:pf-icon .5s cubic-bezier(.3,1.4,.5,1) both}
.pfrow .tx{flex:1;min-width:0}
.pfrow .tx b{display:block;font:700 14.5px var(--body);color:var(--ink)}
.pfrow .tx small{display:block;color:var(--soft);font-size:12.5px;margin-top:1px}
.pfrow .nt{color:var(--soft);font-size:12.5px;font-weight:600;flex:none;max-width:48%;text-align:right}
.pfrow .go{flex:none;color:var(--soft);display:grid;place-items:center}
@keyframes pf-row{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
.pflang{display:flex;gap:6px;flex-wrap:wrap}
.pflang button{padding:9px 14px;border-radius:11px;border:1.5px solid var(--line);background:#fff;font:700 13px var(--display);color:var(--soft);cursor:pointer;transition:.15s}
.pflang button:hover{border-color:var(--fire);color:var(--fire)}
.pflang button.on{background:var(--ink);border-color:var(--ink);color:#fff}
.pfsel{display:none;padding:10px 12px;border-radius:11px;border:1.5px solid var(--line);font:700 13px var(--display);background:#fff;color:var(--ink);max-width:150px}
.pfok{flex:none;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#12A15C,#1FBF7A);color:#fff;box-shadow:0 8px 16px -8px rgba(18,161,92,.9)}
@media(max-width:560px){.pflang{display:none}.pfsel{display:inline-block}}
.pfpaths{display:grid;gap:10px;padding:16px 18px}
@media(min-width:620px){.pfpaths{grid-template-columns:1fr 1fr}}
.pfp{display:flex;align-items:center;gap:13px;padding:15px;border-radius:17px;border:1.5px solid var(--line);background:#fff;cursor:pointer;transition:.16s;text-align:left;width:100%}
.pfp:hover{border-color:var(--fire);transform:translateY(-2px)}
.pfp.on{border-color:var(--fire);background:linear-gradient(135deg,#FFF3EC,#F3EEFF);box-shadow:0 16px 30px -22px rgba(255,90,31,.8)}
.pfp .em{font-size:26px;flex:none}
.pfp .tx{flex:1;min-width:0}
.pfp .tx b{display:block;font:700 15px var(--body);color:var(--ink)}
.pfp .tx small{display:block;color:var(--soft);font-size:12px;margin-top:2px;line-height:1.35}
.pfp .tick{flex:none;width:26px;height:26px;border-radius:50%;border:2px solid var(--line);display:grid;place-items:center;color:#fff}
.pfp.on .tick{background:var(--fire);border-color:var(--fire)}
.pfsw{position:relative;width:50px;height:29px;flex:none;display:inline-block}
.pfsw input{position:absolute;opacity:0;width:100%;height:100%;margin:0;cursor:pointer;z-index:2}
.pfsw i{position:absolute;inset:0;background:var(--line);border-radius:999px;transition:.2s}
.pfsw i::after{content:"";position:absolute;left:3px;top:3px;width:23px;height:23px;border-radius:50%;background:#fff;transition:.2s;box-shadow:0 2px 6px rgba(0,0,0,.2)}
.pfsw input:checked+i{background:linear-gradient(135deg,#12A15C,#1FBF7A)}
.pfsw input:checked+i::after{transform:translateX(21px)}
.pfxp{padding:0 18px 16px;color:var(--soft);font-size:13.5px;line-height:1.6}
.pfout{display:block;width:100%;padding:15px;border-radius:18px;border:1.5px solid var(--line);background:#fff;color:var(--ink);font:700 14px var(--body);display:flex;align-items:center;justify-content:center;gap:9px;cursor:pointer;transition:.15s;margin-top:22px}
.pfout:hover{border-color:var(--fire);color:var(--fire)}
.pfcreated{display:block;text-align:center;color:var(--soft);font-size:12px;margin-top:10px}
.pfdz{display:flex;gap:14px;align-items:flex-start;margin-top:18px;padding:16px;border-radius:18px;background:#FFF6F5;border:1.5px solid #F3C6C2;color:#8A3B36;animation:pf-in .5s both}
.pfdz .ic{color:#E5443E;flex:none}
.pfdz b{display:block;font:800 14.5px var(--body)}
.pfdz p{font-size:12.5px;line-height:1.55;color:#9B5B56;margin:4px 0 10px}
.pfdz button{padding:10px 16px;border-radius:12px;border:0;background:#E5443E;color:#fff;font:700 13px var(--body);cursor:pointer}
@media(max-width:560px){
  .pfhero{flex-direction:column;align-items:flex-start;padding:22px}
  .pfi h2{font-size:23px}
  .pfrow .nt{max-width:42%}
}
`;
  document.head.appendChild(s);
}
function renderProfile() {
  var el = $("#s-profile"); if (!el) return;
  pfCss();
  var t = P();
  var d = new Date(U.created).toLocaleDateString(DL[U.lang] || "ru-RU", { day: "numeric", month: "long", year: "numeric" });
  var plans = U.premium ? t.premium : t.freePlan;
  var isAdmin = U.email && U.email.toLowerCase() === "romaskovmaksim04@gmail.com";
  var i = 0;
  function dl(n) { return (i++ * 0.06).toFixed(2); }
  function sec(icon, title) { return '<div class="pfsec" style="animation-delay:' + dl() + 's"><h3><span class="si">' + ic(icon) + "</span>" + title + "</h3>"; }
  function rowA(icon, title, sub, right, act) {
    return '<div class="pfrow' + (act ? " tap" : "") + '"' + (act ? ' data-act="' + act + '"' : "") + ' style="animation-delay:' + dl() + 's">' +
      '<span class="ic">' + ic(icon) + "</span><div class=\"tx\"><b>" + title + "</b>" + (sub ? "<small>" + sub + "</small>" : "") + "</div>" + (right || "") + "</div>";
  }
  var hero = '<div class="pfhero"><div class="pfav">' + fl(52) + "</div><div class=\"pfi\"><small>" + t.acc + "</small><h2>" + esc(U.name || t.none) + "</h2><p>" + esc(U.email) + '</p><div class="pfbadges">' +
    '<span class="pfbadge' + (U.premium ? " ok" : "") + '">' + ic(U.premium ? "check" : "user") + " " + plans + "</span>" +
    (U.path ? '<span class="pfbadge">' + ic("map") + " " + (U.path === "english" ? t.pathEn : t.pathIe) + "</span>" : "") +
    '<span class="pfbadge">' + ic("globe") + " " + ({ en: "EN", ru: "RU", kz: "KZ", uz: "UZ" }[U.lang] || "RU") + "</span>" +
    "</div></div></div>";

  var prof = sec("user", t.profile) + '<div class="pfcard">' +
    rowA("user", t.name, esc(U.name || t.none), '<span class="go">' + ic("pencil") + "</span>", "name") +
    rowA("mail", t.email, esc(U.email), '<span class="nt">' + t.emailNote + "</span>") +
    rowA("send", t.news, t.newsNote, '<label class="pfsw"><input type="checkbox" data-act="news"' + (U.news ? " checked" : "") + "><i></i></label>") +
    "</div>";

  var setg = sec("globe", t.settings) + '<div class="pfcard">' +
    rowA("globe", t.language, "", '<div class="pflang">' + [["en", "EN"], ["ru", "RU"], ["kz", "KZ"], ["uz", "UZ"]].map(function (x) { return '<button class="' + (U.lang === x[0] ? "on" : "") + '" data-act="lang" data-l="' + x[0] + '">' + x[1] + "</button>"; }).join("") + '</div><select class="pfsel" id="pfLangSel">' + [["en", "English"], ["ru", "Русский"], ["kz", "Қазақша"], ["uz", "Oʻzbekcha"]].map(function (x) { return '<option value="' + x[0] + '"' + (U.lang === x[0] ? " selected" : "") + ">" + x[1] + "</option>"; }).join("") + "</select>") +
    '<div class="pfrow" style="display:block;animation-delay:' + dl() + 's"><div class="tx"><b>' + t.usage + "</b><small>" + t.usageNote + '</small></div><div class="pfpaths" style="padding:14px 0 0">' +
      '<button class="pfp' + (U.path === "english" ? " on" : "") + '" data-act="pick" data-p="english"><span class="em">🗣</span><div class="tx"><b>' + t.pathEn + "</b><small>" + t.pathEnSub + '</small></div><span class="tick">' + ic("check") + "</span></button>" +
      '<button class="pfp' + (U.path === "ielts" ? " on" : "") + '" data-act="pick" data-p="ielts"><span class="em">🎯</span><div class="tx"><b>' + t.pathIe + "</b><small>" + t.pathIeSub + '</small></div><span class="tick">' + ic("check") + "</span></button>" +
    "</div></div></div>";

  var subs = sec("crown", t.subscription) + '<div class="pfcard">' +
    '<div class="pfrow tap" data-act="sub" style="animation-delay:' + dl() + 's"><span class="ic">' + ic("crown") + '</span><div class="tx"><b>' + plans + "</b><small>" + (U.premium ? t.active : t.noSub) + '</small></div>' + (U.premium ? '<span class="pfok">' + ic("check") + "</span>" : '<span class="nt">⌄</span>') + "</div>" +
    '<div class="pfxp" id="xp-sub" hidden>' + t.premDesc + '<br><a class="btn p sm" href="' + CFG.pricing + '" style="margin-top:10px">' + (U.premium ? renewT() : t.choosePlan) + "</a>" + (CFG.demo ? '<button class="btn g sm" data-act="demoPro" style="margin-left:8px">' + (U.premium ? "Off" : "On") + " Premium (demo)</button>" : "") + "</div>" +
    "</div>";

  var guar = sec("shield", t.guarantee) + '<div class="pfcard">' +
    '<div class="pfrow tap" data-act="guar" style="animation-delay:' + dl() + 's"><span class="ic">' + ic("shield") + '</span><div class="tx"><b>' + t.guarantee + "</b></div>" + '<span class="go">' + ic("down") + "</span></div>" +
    '<div class="pfxp" id="xp-guar" hidden>' + t.guaranteeText + "</div></div>";

  var sup = sec("mail", t.support) + '<div class="pfcard">' +
    '<a class="pfrow tap" href="mailto:' + CFG.support + '" style="text-decoration:none;animation-delay:' + dl() + 's"><span class="ic">' + ic("mail") + '</span><div class="tx"><b>' + CFG.support + "</b><small>" + t.support + '</small></div><span class="go">' + ic("chev") + "</span></a>" +
    '<a class="pfrow tap" href="' + CFG.privacy + '" style="text-decoration:none;animation-delay:' + dl() + 's"><span class="ic">' + ic("shield") + '</span><div class="tx"><b>' + t.privacy + "</b></div><span class=\"go\">" + ic("chev") + "</span></a>" +
    '<a class="pfrow tap" href="' + CFG.terms + '" style="text-decoration:none;animation-delay:' + dl() + 's"><span class="ic">' + ic("file") + '</span><div class="tx"><b>' + t.terms + "</b></div><span class=\"go\">" + ic("chev") + "</span></a>" +
    (isAdmin ? '<a class="pfrow tap" href="admin.html" style="text-decoration:none;animation-delay:' + dl() + 's"><span class="ic">' + ic("shield") + '</span><div class="tx"><b>Админ-панель</b><small>Пользователи, тарифы, задания</small></div><span class="go">' + ic("chev") + "</span></a>" : "") +
    "</div>";

  el.innerHTML = hero + prof + setg + subs + guar + sup +
    '<button class="pfout" data-act="logout" style="animation-delay:' + dl() + 's">' + ic("logout") + " " + t.logout + "</button>" +
    '<span class="pfcreated">' + t.created + " " + d + "</span>" +
    '<div class="pfdz" style="animation-delay:' + dl() + 's">' + ic("alert") + "<div><b>" + t.delTitle + "</b><p>" + t.delText + '</p><button data-act="del">' + t.delBtn + "</button></div></div>";
}
function sh(i, t) { return '<div class="sh"><span class="si">' + ic(i) + "</span><h3>" + t + "</h3></div>"; }

/* ---------- словарь (общий для обоих профилей) ---------- */
var TOP = {
  skills: ["Слова-связки", "Фразовые глаголы", "Структуры предложений", "Наборы тем для Speaking"],
  themes: ["Бизнес и экономика", "Государство, политика и право", "Здоровье и медицина", "Культура, искусство и традиции", "Преступление и наказание", "Образование и обучение", "Наука и исследования", "Технологии и инновации", "Природа, животные и сельское хозяйство", "Работа и занятость"]
};
function dsz(n) { var h = 7; for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 113; return 90 + h; }
function gate(f) { if (GATED && !U.premium) { upsell(f); return true; } return false; }
function renderVocab() {
  var el = $("#s-vocab"); if (!el) return;
  if (w.LexyVocab && w.LexyVocab.render) { w.LexyVocab.render(el); return; }
  var ws = U.words.map(function (x, i) { return { x: x, i: i }; });
  if (U.vsort) ws.sort(function (a, b) { return a.x.k - b.x.k; });
  var chip = function (n) { return U.decks.indexOf(n) < 0 ? '<button class="cp" data-act="vdeck" data-n="' + esc(n) + '">' + ic("plus") + esc(n) + "</button>" : ""; };
  el.innerHTML = '<h1 class="t">Словарь</h1><p class="s">Твой личный словарь</p>' +
    '<div class="vh"><div class="fc">' + fl(50) + '</div><small>КАЖДЫЙ ДЕНЬ</small><h2>Ежедневное повторение</h2><p>повторяй свои слова и добавляй новые</p><div class="acts"><button class="btn w" data-act="vrep">Повторить ещё</button><button class="btn o" data-act="vadd">' + ic("plus") + ' Добавить слова</button><span class="note">' + (ws.length ? "В карточках: " + ws.length + "." : "Сейчас ничего нет. Добавьте слова ниже или зайдите позже.") + "</span></div></div>" +
    '<h2 class="vt">Наборы слов</h2><p class="s" style="margin-bottom:6px">Выбирай темы, чтобы направлять ежедневные слова. Ничего не добавлял — подберём сами.</p>' +
    (U.decks.length ? '<div class="lb">ТВОИ КОЛОДЫ</div>' + U.decks.map(function (n) { return '<div class="dk"><span class="rg">0%</span><div><b>' + esc(n) + "</b><small>0 из " + dsz(n) + ' слов</small></div><button data-act="vundeck" data-n="' + esc(n) + '" aria-label="Убрать">' + ic("x") + "</button></div>"; }).join("") : "") +
    '<label class="srch">' + ic("search") + '<input id="dq" placeholder="Поиск наборов" autocomplete="off"></label>' +
    '<div class="lb">НАВЫКИ</div><div class="chips">' + TOP.skills.map(chip).join("") + '</div><div class="lb">ТЕМЫ</div><div class="chips">' + TOP.themes.map(chip).join("") + "</div>" +
    '<div class="vl"><h2 class="vt">Словарь · ' + ws.length + '</h2></div><div class="vtools"><label class="srch">' + ic("search") + '<input id="wq" placeholder="Поиск слов…" autocomplete="off"></label><button class="tb" data-act="vfilt">' + ic("sliders") + 'Фильтры</button><button class="tb" data-act="vsort">' + ic("sort") + "По изученности</button></div>" +
    (ws.length ? '<div id="wl">' + ws.map(function (o) { return '<div class="wc"><b>' + esc(o.x.w) + "</b><span>" + esc(o.x.t || "") + "</span><em>" + (o.x.k >= 3 ? "выучено" : o.x.k ? "учу " + o.x.k + "/3" : "") + '</em><button data-act="vdel" data-i="' + o.i + '" aria-label="Удалить">' + ic("x") + "</button></div>"; }).join("") + "</div>"
      : '<div class="vb"><div class="pg">' + fl(30) + "</div><h3>Карточек пока нет</h3><p>Сохраняйте слова из тестов и фидбека, чтобы наращивать словарный запас.</p><button class=\"btn\" data-act=\"vadd\">Добавить слова</button></div>");
  $("#dq").oninput = function () { var q = this.value.toLowerCase(); $$(".cp", el).forEach(function (c) { c.hidden = c.textContent.toLowerCase().indexOf(q) < 0; }); };
  var wq = $("#wq"); if (wq) wq.oninput = function () { var q = this.value.toLowerCase(); $$(".wc", el).forEach(function (c) { c.hidden = c.textContent.toLowerCase().indexOf(q) < 0; }); };
}
var RV = { q: [], i: 0, s: false };
function rvDraw() {
  var x = U.words[RV.q[RV.i]];
  modal({ title: "Повторение", body: '<div class="fcard"><small>' + (RV.i + 1) + " / " + RV.q.length + '</small><div class="w">' + esc(x.w) + '</div><div class="tr">' + (RV.s ? esc(x.t || "—") : "") + "</div></div>",
    foot: RV.s ? '<button class="btn g" data-act="ragain">Ещё раз</button><button class="btn p" data-act="rknow">Знаю</button>' : '<button class="btn g" data-act="mclose">Закрыть</button><button class="btn p" data-act="rshow">Показать перевод</button>' });
}
function rvNext() {
  RV.i++; RV.s = false;
  if (RV.i >= RV.q.length) { closeM(); addMin(2); toast("Повторение завершено 🎉"); renderVocab(); return; }
  rvDraw();
}

/* ---------- действия (делегирование кликов) ---------- */
A.burger = function () { document.body.classList.toggle("open"); };
A.mclose = closeM;
A.mok = function () { var f = MOK; if (f && f($("#mv")) === false) return; closeM(); };
A.dismiss = function (el, e) { e.preventDefault(); e.stopPropagation(); U.dismiss[el.dataset.k] = 1; save(); side(); };
A.pick = function (el) { switchPath(el.dataset.p); };
A.name = function () {
  var m = M();
  modal({ title: m.nameQ, body: '<label>' + m.nameLbl + '</label><input type="text" id="nm" maxlength="40" value="' + esc(U.name) + '">', ok: m.save, cancel: m.cancel, init: function () { setTimeout(function () { $("#nm").focus(); }, 50); },
    onOk: function () { save({ name: $("#nm").value.trim() }); renderProfile(); toast(m.nameSaved); } });
};
A.news = function (el) { save({ news: el.checked }); toast(el.checked ? C().newsOn : C().newsOff); };
A.lang = function (el) { save({ lang: el.dataset.l }); try { w.localStorage.setItem("lang", el.dataset.l); } catch (e) {} gates(); show(CUR); };
A.sub = function () { $("#xp-sub").hidden = !$("#xp-sub").hidden; };
A.guar = function () { $("#xp-guar").hidden = !$("#xp-guar").hidden; };
A.demoPro = function () {
  if (!CFG.demo) return;
  save({ premium: !U.premium }); gates(); show(CUR);
  toast(U.premium ? C().demoOn : C().demoOff);
};
A.logout = function () {
  try {
    localStorage.removeItem(SES);
    localStorage.removeItem("user_logged_in");
    localStorage.removeItem("user_email");
  } catch (e) {}
  var go = function () { location.href = CFG.home; };
  if (w.LexyAuth) {
    try { Promise.resolve(w.LexyAuth.logout()).then(go, go); return; } catch (e) {}
  }
  go();
};
A.del = function () {
  var m = M();
  modal({ title: m.delQ, body: "<p>" + m.delQText + "</p>", ok: m.delYes, cancel: m.cancel,
    onOk: function () {
      if (!w.LexyAuth) return;
      var btn = $("#mv .btn.p"); if (btn) { btn.disabled = true; btn.textContent = "…"; }
      w.LexyAuth.deleteAccount().then(function () {
        DB.remove(U.email);
        localStorage.removeItem(SES);
        localStorage.removeItem("user_logged_in");
        localStorage.removeItem("user_email");
        location.href = CFG.home;
      }).catch(function () {
        if (btn) { btn.disabled = false; btn.textContent = C().delBtn; }
        toast(C().delFail);
      });
      return false;
    } });
};
A.upsell = function (el) { upsell(el.dataset.f); };
A.vdeck = function (el) { if (gate("vocab")) return; U.decks.push(el.dataset.n); save(); renderVocab(); toast("Набор добавлен"); };
A.vundeck = function (el) { U.decks.splice(U.decks.indexOf(el.dataset.n), 1); save(); renderVocab(); };
A.vdel = function (el) { U.words.splice(+el.dataset.i, 1); save(); renderVocab(); };
A.vsort = function () { save({ vsort: !U.vsort }); renderVocab(); };
A.vfilt = function () { toast("Фильтры появятся позже"); };
A.vadd = function () {
  if (gate("vocab")) return;
  modal({ title: "Добавить слова", body: '<p>По одному в строке: <b>word — перевод</b></p><textarea id="wt" placeholder="resilient — устойчивый&#10;mitigate — смягчать"></textarea>', ok: "Добавить", cancel: "Отмена",
    onOk: function () {
      var n = 0;
      $("#wt").value.split("\n").forEach(function (ln) {
        var p = ln.split(/\s*[-–—:,]\s*/), w0 = (p.shift() || "").trim();
        if (w0) { U.words.push({ w: w0, t: p.join(", ").trim(), k: 0 }); n++; }
      });
      if (!n) { toast("Напиши хотя бы одно слово"); return false; }
      save(); renderVocab(); toast("Добавлено слов: " + n);
    } });
};
A.vrep = function () {
  if (gate("vocab")) return;
  var q = []; U.words.forEach(function (x, i) { if (x.k < 3) q.push(i); });
  if (!q.length) { toast(U.words.length ? "Все слова уже выучены 🎉" : "Сначала добавь слова"); return; }
  RV = { q: q, i: 0, s: false }; rvDraw();
};
A.rshow = function () { RV.s = true; rvDraw(); };
A.rknow = function () { var x = U.words[RV.q[RV.i]]; x.k++; save(); rvNext(); };
A.ragain = function () { rvNext(); };

/* ---------- запуск ---------- */
function whenAuth(fn) {
  if (w.LexyAuth && w.LexyAuth.ready && w.LexyAuth.ready.then) {
    w.LexyAuth.ready.then(function () { if (!REDIR) fn(); }, function () { if (!REDIR) fn(); });
    return;
  }
  fn();
}
function guard(p) {
  whenAuth(function () {
    if (!load()) return;
    if (U.path && U.path !== p) { REDIR = true; location.replace(CFG.pages[U.path]); }
  });
}
function init(p, o) {
  whenAuth(function () {
  if (REDIR) return;
  if (!U) load();
  PROF = p; H = (o && o.render) || {}; GATED = !!(o && o.vocabGated);
  document.body.insertAdjacentHTML("afterbegin", sprite() +
    '<div class="veil" data-act="burger"></div><div class="mbar"><button class="bb" data-act="burger" aria-label="Меню">' + ic("menu") + '</button><a class="brand" href="dashboard.html">' + fl(28) + 'Lexy</a></div><aside class="side" id="side"></aside>' +
    '<div class="mv" id="mv"></div><div class="toast" id="toast"></div><a class="fab" href="mailto:' + CFG.support + '" aria-label="Поддержка">' + fl(26) + "</a>");
  document.addEventListener("click", function (e) {
    if (e.target.id === "mv" && !MLOCK) { closeM(); return; }
    var g = e.target.closest("[data-go]");
    if (g) { e.preventDefault(); var id = g.dataset.go; if (location.hash === "#" + id) show(id); else location.hash = id; return; }
    var a = e.target.closest("[data-act]");
    if (a && A[a.dataset.act]) A[a.dataset.act](a, e);
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !MLOCK) closeM(); });
  document.addEventListener("change", function (e) { if (e.target && e.target.id === "pfLangSel") A.lang({ dataset: { l: e.target.value } }); });
  w.addEventListener("hashchange", function () { show((location.hash || "").slice(1)); });
  w.addEventListener("storage", function (e) {   // профиль сменили в другой вкладке/файле
    if (e.key !== KEY) return;
    var n = DB.load(U.email); if (!n) return;
    U = Object.assign(U, n);
    if (n.path && n.path !== PROF) location.replace(CFG.pages[n.path]);
  });
  gates();
  loadNotifs();
  CUR = (location.hash || "").slice(1) || NAV[p][0][0];
  show(CUR);
  if (!U.path) chooser();
  });
}
/* страница-маршрутизатор dashboard.html */
function standalone() {
  whenAuth(function () {
  if (!load()) return;
  if (U.path) { location.replace(CFG.pages[U.path] + (location.search || "")); return; }
  document.body.insertAdjacentHTML("afterbegin", sprite() + '<div class="mv" id="mv"></div><div class="toast" id="toast"></div>');
  document.addEventListener("click", function (e) { var a = e.target.closest("[data-act]"); if (a && A[a.dataset.act]) A[a.dataset.act](a, e); });
  PROF = "none"; chooser();
  });
}

w.Lexy = {
  cfg: CFG, acts: A, guard: guard, init: init, standalone: standalone, show: show, save: save, modal: modal, close: closeM, toast: toast,
  ic: ic, fl: fl, esc: esc, iso: iso, streakN: streakN, weekDots: weekDots, addMin: addMin, mins: minsStat, upsell: upsell,
  get user() { return U; }
};
})(window);