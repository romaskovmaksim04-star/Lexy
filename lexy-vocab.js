/* ==========================================================
   lexy-vocab.js — словарь Lexy (Pro и выше)
   • Механика «знаю / не знаю» с интервальным повторением (SRS)
   • Много слов по уровням A1–C2
   • Незнакомые слова падают в очередь повторения
   ========================================================== */
(function (w) {
  "use strict";

  var WORDS = {
    A1: [
      ["apple", "яблоко"], ["water", "вода"], ["bread", "хлеб"], ["house", "дом"], ["friend", "друг"],
      ["school", "школа"], ["family", "семья"], ["money", "деньги"], ["time", "время"], ["day", "день"],
      ["night", "ночь"], ["book", "книга"], ["hand", "рука"], ["head", "голова"], ["door", "дверь"],
      ["window", "окно"], ["food", "еда"], ["table", "стол"], ["city", "город"], ["road", "дорога"],
      ["car", "машина"], ["green", "зелёный"], ["happy", "счастливый"], ["big", "большой"], ["small", "маленький"],
      ["good", "хороший"], ["work", "работа"], ["name", "имя"], ["help", "помощь"], ["come", "приходить"]
    ],
    A2: [
      ["airport", "аэропорт"], ["ticket", "билет"], ["luggage", "багаж"], ["meeting", "встреча"], ["office", "офис"],
      ["schedule", "расписание"], ["colleague", "коллега"], ["weather", "погода"], ["health", "здоровье"], ["medicine", "лекарство"],
      ["appointment", "приём"], ["discount", "скидка"], ["receipt", "чек"], ["device", "устройство"], ["screen", "экран"],
      ["password", "пароль"], ["update", "обновление"], ["forest", "лес"], ["river", "река"], ["environment", "окружающая среда"],
      ["worried", "встревоженный"], ["excited", "взволнованный"], ["repair", "ремонтировать"], ["reduce", "сокращать"], ["improve", "улучшать"],
      ["achieve", "достигать"], ["experience", "опыт"], ["schedule", "планировать"], ["reliable", "надёжный"], ["available", "доступный"]
    ],
    B1: [
      ["responsibility", "ответственность"], ["promotion", "повышение"], ["deadline", "срок"], ["suggest", "предлагать"], ["however", "однако"],
      ["although", "хотя"], ["therefore", "следовательно"], ["advantage", "преимущество"], ["disadvantage", "недостаток"], ["solve", "решать"],
      ["cause", "причина"], ["effect", "эффект"], ["avoid", "избегать"], ["network", "сеть"], ["security", "безопасность"],
      ["access", "доступ"], ["pollution", "загрязнение"], ["recycle", "перерабатывать"], ["energy", "энергия"], ["climate", "климат"],
      ["protect", "защищать"], ["degree", "степень"], ["research", "исследование"], ["knowledge", "знание"], ["skill", "навык"],
      ["attend", "посещать"], ["facility", "оснащение"], ["reduction", "сокращение"], ["demand", "спрос"], ["supply", "предложение"]
    ],
    B2: [
      ["nevertheless", "тем не менее"], ["furthermore", "к тому же"], ["consequently", "следовательно"], ["assumption", "предположение"], ["evidence", "доказательство"],
      ["implication", "следствие"], ["controversial", "спорный"], ["significant", "значительный"], ["negotiate", "вести переговоры"], ["implement", "внедрять"],
      ["efficient", "эффективный"], ["stakeholder", "заинтересованная сторона"], ["sustainable", "устойчивый"], ["strategy", "стратегия"], ["allocate", "распределять"],
      ["inequality", "неравенство"], ["welfare", "благосостояние"], ["cohesion", "сплочённость"], ["diverse", "разнообразный"], ["infrastructure", "инфраструктура"],
      ["hypothesis", "гипотеза"], ["correlation", "корреляция"], ["methodology", "методология"], ["conclude", "делать вывод"], ["valid", "обоснованный"]
    ],
    C1: [
      ["nuance", "нюанс"], ["coherent", "связный"], ["pragmatic", "прагматичный"], ["ambiguous", "двусмысленный"], ["underscore", "подчёркивать"],
      ["mitigate", "смягчать"], ["advocate", "выступать за"], ["inherent", "присущий"], ["notably", "в частности"], ["arguably", "возможно"],
      ["scrutinise", "тщательно изучать"], ["paradigm", "парадигма"], ["substantiate", "обосновывать"], ["delineate", "очерчивать"], ["empirical", "эмпирический"],
      ["bear in mind", "иметь в виду"], ["cut corners", "халтурить"], ["in the long run", "в долгосрочной перспективе"], ["get the gist", "уловить суть"], ["touch on", "затрагивать"]
    ],
    C2: [
      ["ubiquitous", "вездесущий"], ["ephemeral", "мимолётный"], ["juxtapose", "сопоставлять"], ["ostensible", "мнимый"], ["pragmatism", "прагматизм"],
      ["recondite", "малопонятный"], ["vociferous", "громогласный"], ["intrinsic", "внутренне присущий"], ["tenuous", "шаткий"], ["salient", "выступающий"]
    ]
  };

  var LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
  var LEVEL_NAME = { A1: "Начальный", A2: "Элементарный", B1: "Средний", B2: "Выше среднего", C1: "Продвинутый", C2: "В совершенстве" };
  var INTERVAL = [0, 1, 2, 4, 7, 15, 30]; // дни по коробкам
  var KNOWN_BOX = 5;

  function allWords() { var out = []; LEVELS.forEach(function (l) { (WORDS[l] || []).forEach(function (p) { out.push({ w: p[0], t: p[1], lv: l }); }); }); return out; }
  function byLevel(l) { return (WORDS[l] || []).map(function (p) { return { w: p[0], t: p[1], lv: l }; }); }

  /* состояние SRS хранится в Lexy.user.vocab = { st: { word: {b,due} }, level } */
  function state() {
    var u = w.Lexy.user;
    if (!u.vocab) u.vocab = { st: {}, level: "A1" };
    if (!u.vocab.st) u.vocab.st = {};
    if (!u.vocab.level) u.vocab.level = "A1";
    return u.vocab;
  }
  function saveVocab() { w.Lexy.save({ vocab: state() }); }
  function stOf(word) { var s = state().st; if (!s[word]) s[word] = { b: 0, due: 0 }; return s[word]; }
  function isKnown(word) { return stOf(word).b >= KNOWN_BOX; }
  function dueWords() {
    var now = Date.now(), out = [];
    var base = byLevel(state().level).concat(poolExtra());
    var seen = {};
    base.forEach(function (o) {
      if (seen[o.w]) return; seen[o.w] = 1;
      var s = stOf(o.w);
      if (s.b < KNOWN_BOX && s.due <= now) out.push(o);
    });
    return out;
  }
  function poolExtra() { return []; }

  function progress() {
    var lv = state().level, list = byLevel(lv), known = 0;
    list.forEach(function (o) { if (isKnown(o.w)) known++; });
    return { total: list.length, known: known, pct: list.length ? Math.round(known / list.length * 100) : 0 };
  }
  function reviewCount() { return dueWords().length; }

  /* ответ на карточку */
  function answer(word, knew) {
    var s = stOf(word);
    if (knew) { s.b = Math.min(KNOWN_BOX, s.b + 1); }
    else { s.b = 0; }
    s.due = Date.now() + (INTERVAL[s.b] || 0) * 864e5;
    saveVocab();
    return s;
  }
  function addCustom(word, trans) { var s = state(); s.st[String(word).toLowerCase()] = { b: 0, due: 0, t: trans || "" }; saveVocab(); }

  /* ---------- UI ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ic(n) { return w.Lexy.ic(n); }

  function render(el) {
    if (!el) return;
    var premium = !!w.Lexy.user.premium;
    if (!premium) { renderLock(el); return; }
    renderMain(el);
  }

  function renderLock(el) {
    el.innerHTML = '<h1 class="t">Словарь</h1><p class="s">Личный словарь с умным повторением</p>' +
      '<div class="card" style="margin-top:18px;text-align:center"><div style="font-size:42px">🔒</div>' +
      "<h2 style=\"font:800 22px var(--display);margin:10px 0\">Доступно в Premium</h2>" +
      "<p class=\"s\">Словарь с механикой «знаю / не знаю», интервальным повторением и словами по уровням A1–C2 — на тарифах Pro и Pro+.</p>" +
      '<a class="btn p" href="pricing.html" style="margin-top:14px">' + ic("spark") + " Получить Premium</a></div>";
  }

  function renderMain(el, session) {
    if (session) { renderSession(el, session); return; }
    var s = state(), p = progress(), due = reviewCount();
    var chips = LEVELS.map(function (l) { return '<button class="pill' + (s.level === l ? " on" : "") + '" data-lv="' + l + '">' + l + " <em>" + (WORDS[l] || []).length + "</em></button>"; }).join("");
    el.innerHTML = '<h1 class="t">Словарь</h1><p class="s">Учим слова по уровням · «знаю / не знаю» → повторение</p>' +
      '<div class="card" style="margin-top:16px"><div class="qmeta"><span>Уровень ' + s.level + " · " + LEVEL_NAME[s.level] + "</span><span>" + p.known + " / " + p.total + "</span></div>" +
      '<div class="progress"><i style="width:' + p.pct + '%"></i></div>' +
      '<button class="btn p" id="vstudy" style="margin-top:6px">' + ic("play") + " Учить слова (" + p.total + ")</button>" +
      (due ? '<button class="btn" id="vreview" style="margin-top:10px;background:#1E9BFF;color:#fff">' + ic("hist") + " Повторить сейчас (" + due + ")</button>" : "") +
      "</div>" +
      '<div class="lb" style="margin:16px 0 8px;font:700 12px var(--display);letter-spacing:.06em;color:var(--soft)">УРОВНИ</div><div class="chips">' + chips + "</div>" +
      '<div class="card" style="margin-top:16px"><div class="row" style="margin:0"><input id="vaddw" placeholder="своё слово" style="flex:1;padding:12px 14px;border:1.5px solid var(--line);border-radius:12px;outline:none"><input id="vaddt" placeholder="перевод" style="flex:1;padding:12px 14px;border:1.5px solid var(--line);border-radius:12px;outline:none"><button class="btn" id="vadd">' + ic("plus") + "</button></div></div>";
    el.querySelectorAll("[data-lv]").forEach(function (b) { b.addEventListener("click", function () { state().level = b.dataset.lv; saveVocab(); renderMain(el); }); });
    $("#vstudy", el).addEventListener("click", function () { renderMain(el, { queue: sessionQueue(), i: 0, shown: false, knew: 0, total: 0 }); });
    var vr = $("#vreview", el); if (vr) vr.addEventListener("click", function () { renderMain(el, { queue: dueWords(), i: 0, shown: false, knew: 0, total: 0, review: true }); });
    $("#vadd", el).addEventListener("click", function () {
      var wv = $("#vaddw", el).value.trim(), tv = $("#vaddt", el).value.trim();
      if (!wv) { w.Lexy.toast("Введи слово"); return; }
      addCustom(wv, tv); w.Lexy.toast("Добавлено: " + wv); renderMain(el);
    });
  }

  function sessionQueue() {
    var base = byLevel(state().level);
    // сначала те, что уже в процессе, потом новые
    var known = {}, seen = {};
    var inProgress = [], fresh = [];
    base.forEach(function (o) {
      if (seen[o.w]) return; seen[o.w] = 1;
      var s = stOf(o.w);
      if (s.b > 0 && s.b < KNOWN_BOX) inProgress.push(o);
      else if (s.b === 0) fresh.push(o);
    });
    return inProgress.concat(fresh);
  }

  function renderSession(el, se) {
    if (se.i >= se.queue.length) {
      el.innerHTML = '<div class="card" style="text-align:center;margin-top:30px"><div style="font-size:42px">🎉</div><h2 style="font:800 22px var(--display);margin:8px 0">Сессия завершена</h2><p class="s">Знаю: ' + se.knew + " · Не знаю: " + se.total + " из " + se.queue.length + '</p><button class="btn p" id="vdone" style="margin-top:14px">К словарю</button></div>';
      $("#vdone", el).addEventListener("click", function () { renderMain(el); });
      return;
    }
    var o = se.queue[se.i], s = stOf(o.w);
    var boxLabel = s.b >= KNOWN_BOX ? "выучено" : s.b ? "повторение " + s.b + "/5" : "новое";
    el.innerHTML = '<div class="qmeta"><span>' + esc(LEVEL_NAME[o.lv]) + " · " + o.lv + '</span><span>' + (se.i + 1) + " / " + se.queue.length + '</span></div>' +
      '<div class="progress"><i style="width:' + Math.round(se.i / se.queue.length * 100) + '%"></i></div>' +
      '<div class="card" style="text-align:center;margin-top:16px"><small style="color:var(--soft)">' + esc(boxLabel) + '</small>' +
      '<div style="font:800 clamp(28px,7vw,44px)/1.1 var(--display);letter-spacing:-.03em;margin:14px 0">' + esc(o.w) + "</div>" +
      (se.shown ? '<div style="font:600 20px var(--body);color:var(--fire);margin-bottom:10px">' + esc(o.t) + '</div>' : "") +
      "<div style=\"display:flex;gap:10px;justify-content:center;margin-top:8px\">" +
      "<button class=\"btn\" id=\"vno\" style=\"background:#FFF2F1;color:#E5443E;border:1.5px solid #F3C6C2\">Не знаю</button>" +
      "<button class=\"btn p\" id=\"vyes\">Знаю</button></div></div>" +
      (se.shown ? "" : '<button class="btn ghost" id="vshow" style="margin-top:12px;width:100%">Показать перевод</button>') +
      '<button class="lnk" id="vq" style="margin-top:14px">Завершить</button>';

    if (se.shown) {
      $("#vno", el).addEventListener("click", function () { answer(o.w, false); se.total++; renderSession(el, { queue: se.queue, i: se.i + 1, shown: false, knew: se.knew, total: se.total, review: se.review }); });
      $("#vyes", el).addEventListener("click", function () { answer(o.w, true); se.knew++; renderSession(el, { queue: se.queue, i: se.i + 1, shown: false, knew: se.knew, total: se.total, review: se.review }); });
    } else {
      $("#vshow", el).addEventListener("click", function () { renderSession(el, { queue: se.queue, i: se.i, shown: true, knew: se.knew, total: se.total, review: se.review }); });
    }
    $("#vq", el).addEventListener("click", function () { renderMain(el); });
  }

  function chipCss() { /* стили .pill/.chips есть в lexy.css; при отсутствии — fallback */ }

  w.LexyVocab = {
    WORDS: WORDS, LEVELS: LEVELS,
    render: render,
    dueCount: reviewCount,
    total: function () { return allWords().length; },
    answer: answer
  };
})(window);
