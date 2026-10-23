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
  demo: true,              // показывать кнопку «включить Premium (демо)» в профиле
  requireAuth: true,       // true = без сессии отправлять на login.html
  login: "login.html", pricing: "pricing.html", home: "main.html",
  privacy: "privacy.html", terms: "terms.html", test: "test.html",
  support: "support@lexy.app", tg: "https://t.me/",
  pages: { english: "dashboard-english.html", ielts: "dashboard-ielts.html" }
}, w.LEXY_CONFIG || {});

var KEY = "lexy_db_v1", SES = "lexy_session";
var U = null, PROF = null, CUR = null, MOK = null, MLOCK = false, REDIR = false, GATED = false;
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
function session() {
  var m = null;
  try {
    m = localStorage.getItem(SES);
    if (!m && localStorage.getItem("user_logged_in") === "true") m = localStorage.getItem("user_email") || "";
    var rec = m ? DB.load(m) : null;
    if (m && (!rec || !rec.passHash || !rec.salt)) {
      localStorage.removeItem(SES);
      localStorage.removeItem("user_logged_in");
      localStorage.removeItem("user_email");
      m = null;
    }
  } catch (e) { m = null; }
  if (!m) {
    if (CFG.requireAuth) { REDIR = true; location.replace(CFG.login); return null; }
    m = "demo@lexy.app";
  }
  localStorage.setItem(SES, m);
  return m;
}
function load() {
  var m = session(); if (!m) return null;
  U = Object.assign(fresh(m), DB.load(m) || {});
  var t = iso();
  if (U.streak.indexOf(t) < 0) { U.streak.push(t); U.streak = U.streak.slice(-400); }
  DB.save(U);
  return U;
}
function save(p) { Object.assign(U, p || {}); DB.save(U); }

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
  ru: { path: "Путь", talk: "Разговор", vocab: "Словарь", progress: "Прогресс", home: "Главная", tests: "Тесты", stats: "Статистика", ai: "Lexy AI", games: "Игры", profile: "Личный кабинет", prem: "Получить Premium" },
  en: { path: "Path", talk: "Talk", vocab: "Vocabulary", progress: "Progress", home: "Home", tests: "Tests", stats: "Statistics", ai: "Lexy AI", games: "Games", profile: "My account", prem: "Get Premium" },
  uz: { path: "Yo‘l", talk: "Suhbat", vocab: "Lug‘at", progress: "Taraqqiyot", home: "Bosh sahifa", tests: "Testlar", stats: "Statistika", ai: "Lexy AI", games: "O‘yinlar", profile: "Kabinet", prem: "Premium olish" }
};
/* [id раздела, иконка, ключ замка]. Замок показывается, пока нет Premium */
var NAV = {
  english: [["path", "map"], ["talk", "talk", "ai"], ["vocab", "vocab"], ["progress", "home"]],
  ielts: [["home", "home"], ["tests", "file"], ["stats", "trend"], ["vocab", "vocab", "soft"], ["ai", "spark", "ai"], ["games", "game", "games"]]
};
function L() { return LAB[U.lang] || LAB.ru; }

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
  var T = { vocab: "Словарь с карточками и наборами слов", ai: "Lexy AI — разговоры с ИИ", games: "Игры для тренировки под давлением" };
  modal({ title: "Доступно в Premium", body: "<p>" + (T[f] || "Эта функция") + " открывается в Premium.</p>", ok: "Получить Premium", cancel: "Позже", onOk: function () { location.href = CFG.pricing; return false; } });
}

/* ---------- замки Premium ---------- */
var LOCKS = {
  ai: { ic: "mic", t: "Lexy AI — премиум-функция", p: "Практикуй живую речь с ИИ-собеседником. Оформи премиум, чтобы открыть безлимитные разговоры.", c: "v" },
  games: { ic: "game", t: "Игры — премиум-функция", p: "Играй в Shadow Speak и Connector Rush и тренируй английский под давлением. Оформи премиум, чтобы открыть игры.", c: "" }
};
function gates() {
  $$("[data-gate]").forEach(function (e) {
    var k = LOCKS[e.dataset.gate];
    e.hidden = U.premium;
    e.innerHTML = U.premium ? "" : '<div class="lks"><div class="lki ' + k.c + '">' + ic(k.ic) + "</div><h2>" + k.t + "</h2><p>" + k.p + '</p><a class="btn ' + (k.c ? "v" : "p") + '" href="' + CFG.pricing + '">' + ic("spark") + " Получить премиум</a></div>";
  });
  $$("[data-pro]").forEach(function (e) { e.hidden = !U.premium; });
}

/* ---------- сайдбар ---------- */
function side() {
  var l = L(), h = '<a class="brand" href="' + CFG.home + '">' + fl(31) + "Lexy</a><nav>";
  NAV[PROF].forEach(function (n) {
    h += '<a class="nv' + (CUR === n[0] ? " on" : "") + '" data-go="' + n[0] + '" href="#' + n[0] + '">' + ic(n[1]) + l[n[0]] + (n[2] && !U.premium ? ic("lock", "lk") : "") + "</a>";
  });
  h += '</nav><div class="bot">';
  if (!U.dismiss.android) h += '<div class="pr red"><button class="x" data-act="dismiss" data-k="android" aria-label="Закрыть">×</button><b>Lexy скоро на Android</b><small>Приложение появится в Google Play</small></div>';
  if (!U.dismiss.tg) h += '<a class="pr wh" href="' + CFG.tg + '" target="_blank" rel="noopener"><button class="x" data-act="dismiss" data-k="tg" aria-label="Закрыть">×</button><span class="pi">' + ic("send") + "</span><div><b>Наш Telegram-канал</b><small>Лайфхаки и разборы ошибок</small></div></a>";
  h += '<a class="nv' + (CUR === "profile" ? " on" : "") + '" data-go="profile" href="#profile">' + ic("user") + l.profile + "</a>";
  h += U.premium ? '<div class="prem" style="background:var(--ok)">' + ic("check") + " Premium активен</div>" : '<a class="prem" href="' + CFG.pricing + '">' + ic("spark") + l.prem + "</a>";
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
  modal({
    title: "Выбери свой путь", lock: lock !== false, foot: false,
    body: "<p>Мы настроим кабинет под твои цели. Потом это можно изменить в личном кабинете.</p>" +
      '<div class="paths"><button data-act="pick" data-p="english"><span class="em">🗣</span><div><b>Разговорный английский</b><small>Уроки-разговоры с Lexy, слова и фразы, без экзаменов</small></div></button>' +
      '<button data-act="pick" data-p="ielts"><span class="em">🎯</span><div><b>Подготовка к IELTS</b><small>Пробные экзамены, баллы, Lexy AI и план до экзамена</small></div></button></div>'
  });
}
function switchPath(p) {
  save({ path: p });
  if (p === PROF) { closeM(); show(CUR); toast("Профиль выбран"); }
  else location.href = CFG.pages[p];
}

/* ---------- профиль (Личный кабинет) ---------- */
function sh(i, t) { return '<div class="sh"><span class="si">' + ic(i) + "</span><h3>" + t + "</h3></div>"; }
function renderProfile() {
  var el = $("#s-profile"); if (!el) return;
  var d = new Date(U.created).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  el.innerHTML =
    '<div class="ph"><div class="av">' + fl(46) + "</div><div><small>ТВОЙ АККАУНТ</small><h2>" + esc(U.name || "Не указано") + "</h2><p>" + esc(U.email) + '</p><span class="bd">' + (U.premium ? "Premium" : "Бесплатный план") + "</span></div></div>" +
    sh("user", "Профиль") + '<div class="card g">' +
      '<div class="rw"><div><small>' + ic("user") + ' Имя</small><b>' + esc(U.name || "Не указано") + '</b></div><button class="ib" data-act="name" aria-label="Изменить имя">' + ic("pencil") + "</button></div>" +
      '<div class="rw"><div><small>' + ic("mail") + " Email</small><b>" + esc(U.email) + '</b></div><span class="nt">Используется для входа, изменить нельзя</span></div>' +
      '<div class="rw"><div><b>Рассылка по email</b><small>Получать советы и напоминания</small></div><label class="sw"><input type="checkbox" data-act="news"' + (U.news ? " checked" : "") + "><span></span></label></div></div>" +
    sh("globe", "Настройки") + '<div class="card g">' +
      '<div class="rw"><b>Язык</b><div class="lg">' + [["en", "EN"], ["ru", "RU"], ["uz", "UZ"]].map(function (x) { return '<button class="' + (U.lang === x[0] ? "on" : "") + '" data-act="lang" data-l="' + x[0] + '">' + x[1] + "</button>"; }).join("") + "</div></div>" +
      '<div class="rw" style="display:block"><b>Для чего ты используешь Lexy</b><small>Приложение подстроится под выбор: главная, меню и Lexy AI.</small><div class="pu" style="margin-top:14px">' +
        '<button class="pcard' + (U.path === "english" ? " on" : "") + '" data-act="pick" data-p="english"><span class="em">🗣</span><div><b>Разговорный английский</b><small>Уроки-разговоры с Lexy, слова и фразы</small></div></button>' +
        '<button class="pcard' + (U.path === "ielts" ? " on" : "") + '" data-act="pick" data-p="ielts"><span class="em">🎯</span><div><b>Подготовка к IELTS</b><small>Пробные экзамены, баллы и план до экзамена</small></div></button></div></div></div>' +
    sh("mail", "Поддержка") + '<div class="card g">' +
      '<a class="rw" href="mailto:' + CFG.support + '"><div><small>' + ic("mail") + " Email</small><b>" + CFG.support + "</b></div>" + ic("chev") + "</a>" +
      '<div class="lgl"><a href="' + CFG.privacy + '">Политика конфиденциальности</a><a href="' + CFG.terms + '">Условия пользования</a></div></div>' +
    '<div class="card g" style="margin-top:16px"><div class="rw" data-act="sub" style="cursor:pointer"><div><small>' + ic("crown") + " Подписка</small><b>" + (U.premium ? "Premium" : "Бесплатный план") + '</b></div><span class="nt">' + (U.premium ? "Активна" : "Нет подписки") + " ⌄</span></div>" +
      '<div class="xp" id="xp-sub" hidden>' + (U.premium ? "Premium открывает Lexy AI, словарь и игры." : "Premium открывает Lexy AI, словарь и игры.") +
      '<br><a class="btn p sm" href="' + CFG.pricing + '">Выбрать тариф</a>' + (CFG.demo ? '<button class="btn g sm" data-act="demoPro">' + (U.premium ? "Выключить" : "Включить") + " Premium (демо)</button>" : "") + "</div></div>" +
    '<div class="card g"><div class="rw" data-act="guar" style="cursor:pointer"><div><b>' + ic("shield") + " Гарантия возврата</b></div>" + ic("down") + '</div><div class="xp" id="xp-guar" hidden>Двойная гарантия: не набрал нужный балл — вернём деньги или оплатим пересдачу. Условия уточняй в поддержке.</div></div>' +
    '<div class="card out"><button class="btn g blk" data-act="logout">' + ic("logout") + " Выйти</button><small>Аккаунт создан " + d + "</small></div>" +
    '<div class="dz">' + ic("alert") + "<div><b>Удаление аккаунта</b><p>Доступ закроется сразу, аккаунт и данные удалим через 30 дней. Восстановить — только через поддержку.</p><button class=\"btn d sm\" data-act=\"del\">Удалить аккаунт</button></div></div>";
}

/* ---------- словарь (общий для обоих профилей) ---------- */
var TOP = {
  skills: ["Слова-связки", "Фразовые глаголы", "Структуры предложений", "Наборы тем для Speaking"],
  themes: ["Бизнес и экономика", "Государство, политика и право", "Здоровье и медицина", "Культура, искусство и традиции", "Преступление и наказание", "Образование и обучение", "Наука и исследования", "Технологии и инновации", "Природа, животные и сельское хозяйство", "Работа и занятость"]
};
function dsz(n) { var h = 7; for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 113; return 90 + h; }
function gate(f) { if (GATED && !U.premium) { upsell(f); return true; } return false; }
function renderVocab() {
  var el = $("#s-vocab"); if (!el) return;
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
  modal({ title: "Как тебя зовут?", body: '<label>Имя</label><input type="text" id="nm" maxlength="40" value="' + esc(U.name) + '">', ok: "Сохранить", cancel: "Отмена", init: function () { setTimeout(function () { $("#nm").focus(); }, 50); },
    onOk: function () { save({ name: $("#nm").value.trim() }); renderProfile(); toast("Имя сохранено"); } });
};
A.news = function (el) { save({ news: el.checked }); toast(el.checked ? "Рассылка включена" : "Рассылка выключена"); };
A.lang = function (el) { save({ lang: el.dataset.l }); side(); renderProfile(); };
A.sub = function () { $("#xp-sub").hidden = !$("#xp-sub").hidden; };
A.guar = function () { $("#xp-guar").hidden = !$("#xp-guar").hidden; };
A.demoPro = function () { save({ premium: !U.premium }); gates(); show(CUR); toast(U.premium ? "Premium включён (демо)" : "Premium выключен"); };
A.logout = function () {
  localStorage.removeItem(SES);
  localStorage.removeItem("user_logged_in");
  localStorage.removeItem("user_email");
  location.href = CFG.login;
};
A.del = function () {
  modal({ title: "Удалить аккаунт?", body: "<p>Доступ закроется сразу, данные удалим через 30 дней.</p>", ok: "Удалить", cancel: "Отмена",
    onOk: function () {
      DB.remove(U.email);
      localStorage.removeItem(SES);
      localStorage.removeItem("user_logged_in");
      localStorage.removeItem("user_email");
      location.href = CFG.login;
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
function guard(p) {
  if (!load()) return;
  if (U.path && U.path !== p) { REDIR = true; location.replace(CFG.pages[U.path]); }
}
function init(p, o) {
  if (REDIR) return;
  if (!U) load();
  PROF = p; H = (o && o.render) || {}; GATED = !!(o && o.vocabGated);
  document.body.insertAdjacentHTML("afterbegin", sprite() +
    '<div class="veil" data-act="burger"></div><div class="mbar"><button class="bb" data-act="burger" aria-label="Меню">' + ic("menu") + '</button><a class="brand" href="' + CFG.home + '">' + fl(28) + 'Lexy</a></div><aside class="side" id="side"></aside>' +
    '<div class="mv" id="mv"></div><div class="toast" id="toast"></div><a class="fab" href="mailto:' + CFG.support + '" aria-label="Поддержка">' + fl(26) + "</a>");
  document.addEventListener("click", function (e) {
    if (e.target.id === "mv" && !MLOCK) { closeM(); return; }
    var g = e.target.closest("[data-go]");
    if (g) { e.preventDefault(); var id = g.dataset.go; if (location.hash === "#" + id) show(id); else location.hash = id; return; }
    var a = e.target.closest("[data-act]");
    if (a && A[a.dataset.act]) A[a.dataset.act](a, e);
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !MLOCK) closeM(); });
  w.addEventListener("hashchange", function () { show((location.hash || "").slice(1)); });
  w.addEventListener("storage", function (e) {   // профиль сменили в другой вкладке/файле
    if (e.key !== KEY) return;
    var n = DB.load(U.email); if (!n) return;
    U = Object.assign(U, n);
    if (n.path && n.path !== PROF) location.replace(CFG.pages[n.path]);
  });
  gates();
  CUR = (location.hash || "").slice(1) || NAV[p][0][0];
  show(CUR);
  if (!U.path) chooser();
}
/* страница-маршрутизатор dashboard.html */
function standalone() {
  if (!load()) return;
  if (U.path) { location.replace(CFG.pages[U.path]); return; }
  document.body.insertAdjacentHTML("afterbegin", sprite() + '<div class="mv" id="mv"></div><div class="toast" id="toast"></div>');
  document.addEventListener("click", function (e) { var a = e.target.closest("[data-act]"); if (a && A[a.dataset.act]) A[a.dataset.act](a, e); });
  PROF = "none"; chooser();
}

w.Lexy = {
  cfg: CFG, acts: A, guard: guard, init: init, standalone: standalone, show: show, save: save, modal: modal, close: closeM, toast: toast,
  ic: ic, fl: fl, esc: esc, iso: iso, streakN: streakN, weekDots: weekDots, addMin: addMin, mins: minsStat, upsell: upsell,
  get user() { return U; }
};
})(window);