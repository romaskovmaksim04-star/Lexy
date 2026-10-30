/* ==========================================================
   lexy-ielts-runner.js — IELTS-раздел (порт движка LexiUp)
   Reading / Listening (tfng, ynng, mcq, gap) + Writing (task1/2,
   модели и графики) + Speaking (таймеры). Данные — LEXY_IELTS
   (lexy-ielts-data.js). Баллы — tables из lib/band.ts.
   ========================================================== */
(function (w, d) {
  "use strict";
  var D = w.LEXY_IELTS || { reading: [], listening: [], writing: [], speaking: [] };
  var app = d.getElementById("app");
  var $ = function (s, r) { return (r || d).querySelector(s); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function el(tag, cls, html) { var e = d.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  /* ---------- ИИ-экзаменатор (Supabase Edge Function ielts-examiner) ---------- */
  function isAuthed() { try { return !!(w.LexyAuth && w.LexyAuth.user && w.LexyAuth.user()); } catch (e) { return false; } }
  function examCall(body) {
    var c = w.LEXY_SUPABASE || {};
    var base = String(c.url || "").replace(/\/+$/, "");
    return w.LexyAuth.token().then(function (t) {
      if (!t) throw { code: "auth" };
      return fetch(base + "/functions/v1/ielts-examiner", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + t, apikey: c.anonKey || "" }, body: JSON.stringify(body) })
        .then(function (r) { return r.text().then(function (tx) { var dj = null; try { dj = tx ? JSON.parse(tx) : null; } catch (e) {} if (!r.ok) throw { code: (dj && dj.error) || "http" }; return dj; }); });
    });
  }
  function renderExaminer(host, ex) {
    if (!ex) { host.innerHTML = '<div class="card">Не удалось получить разбор, попробуй ещё.</div>'; return; }
    var crit = (ex.criteria || []).map(function (c) { return '<div class="exc"><div class="exh"><b>' + esc(c.title) + '</b><span class="exb">' + fmt(c.band) + '</span></div><ul>' + (c.notes || []).map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul></div>"; }).join("");
    var ms = (ex.mistakes || []).map(function (m) { return '<div class="exm"><span class="exw">' + esc(m.wrong) + '</span> → <b>' + esc(m.right) + "</b>" + (m.why ? "<small>" + esc(m.why) + "</small>" : "") + "</div>"; }).join("");
    var rw = ex.rewrite ? '<div class="exrw"><div><b>Было</b><p>' + esc(ex.rewrite.original) + '</p></div><div class="exi"><b>Лучше (Band 7.5+)</b><p>' + esc(ex.rewrite.improved) + "</p></div></div>" : "";
    var nx = (ex.next || []).map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("");
    host.innerHTML = '<div class="exres"><div class="exhead"><div class="exring"><b>' + fmt(ex.band) + '</b><small>Band</small></div><div><h3>Разбор ИИ-экзаменатора</h3><p>' + esc(ex.summary) + "</p></div></div>" + crit + (ms ? "<h4>Ошибки</h4>" + ms : "") + (rw ? "<h4>Как усилить</h4>" + rw : "") + (nx ? "<h4>Что делать дальше</h4><ul class=\"exnext\">" + nx + "</ul>" : "") + "</div>";
  }

  /* ---------- band tables (lib/band.ts) ---------- */
  var L_ROWS = [[39,9],[37,8.5],[35,8],[32,7.5],[30,7],[26,6.5],[23,6],[18,5.5],[16,5],[13,4.5],[10,4],[8,3.5],[6,3],[4,2.5],[2,2],[1,1]];
  var RA_ROWS = [[39,9],[37,8.5],[35,8],[33,7.5],[30,7],[27,6.5],[23,6],[19,5.5],[15,5],[13,4.5],[10,4],[8,3.5],[6,3],[4,2.5],[2,2],[1,1]];
  var RG_ROWS = [[40,9],[39,8.5],[37,8],[36,7.5],[34,7],[32,6.5],[30,6],[27,5.5],[23,5],[19,4.5],[15,4],[12,3.5],[9,3],[6,2.5],[3,2],[1,1]];
  function lookup(t, c) { for (var i = 0; i < t.length; i++) if (c >= t[i][0]) return t[i][1]; return 0; }
  function bandFromPractice(section, correct, total, format) {
    if (!total) return 0;
    var c = Math.max(0, Math.min(40, Math.round(correct / total * 40)));
    var t = section === "listening" ? L_ROWS : (format === "general" ? RG_ROWS : RA_ROWS);
    return lookup(t, c);
  }
  function fmt(b) { return b.toFixed(1); }
  function norm(s) { return String(s == null ? "" : s).trim().toLowerCase().replace(/[.,!?;:"']/g, "").replace(/\s+/g, " "); }
  function isCorrect(q, given) { if (!given || !given.trim()) return false; var g = norm(given); return (q.answer || []).some(function (a) { return norm(a) === g; }); }
  function allQ(groups) { var n = 0; (groups || []).forEach(function (g) { n += g.questions.length; }); return n; }
  function kindLabel(q) { return q.kind === "tfng" ? "TRUE / FALSE / NOT GIVEN" : q.kind === "ynng" ? "YES / NO / NOT GIVEN" : q.kind === "gap" ? "Заполни пропуск" : "A / B / C / D"; }

  /* ---------- ready word / char helpers ---------- */
  function mcqLetter(opt) { var m = String(opt).trim().match(/^([A-D])\b/); return m ? m[1] : null; }
  function mcqText(opt) { return String(opt).replace(/^[A-D]\s+/, ""); }

  /* ---------- chart renderer (Writing task 1) ---------- */
  function chartSvg(ch) {
    if (!ch) return "";
    var C = ["#FF5A1F", "#7A40FF", "#12A15C", "#1E8FE8", "#F2B100"];
    if (ch.kind === "table") {
      var th = "<tr>" + ch.columns.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "</tr>";
      var tr = ch.rows.map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + esc(c) + "</td>"; }).join("") + "</tr>"; }).join("");
      return '<table class="ch-tab">' + th + tr + "</table>";
    }
    if (ch.kind === "pie") {
      return '<div class="ch-pies">' + ch.pies.map(function (p) {
        var total = p.slices.reduce(function (a, s) { return a + s.value; }, 0) || 1, a0 = -Math.PI / 2, segs = "";
        p.slices.forEach(function (s, i) {
          var a1 = a0 + s.value / total * Math.PI * 2, x0 = 50 + 45 * Math.cos(a0), y0 = 50 + 45 * Math.sin(a0), x1 = 50 + 45 * Math.cos(a1), y1 = 50 + 45 * Math.sin(a1);
          var large = (a1 - a0) > Math.PI ? 1 : 0;
          segs += '<path d="M50 50 L' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A45 45 0 ' + large + ' 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' Z" fill="' + C[i % C.length] + '"/>';
          a0 = a1;
        });
        var leg = p.slices.map(function (s, i) { return '<span><i style="background:' + C[i % C.length] + '"></i>' + esc(s.label) + " " + s.value + "</span>"; }).join("");
        return '<figure><svg viewBox="0 0 100 100" width="120" height="120">' + segs + '</svg><figcaption>' + esc(p.title) + '</figcaption><div class="ch-leg">' + leg + "</div></figure>";
      }).join("") + "</div>";
    }
    // line / bar
    var x = ch.x || [], series = ch.series || [];
    var max = 0; series.forEach(function (s) { s.values.forEach(function (v) { if (v > max) max = v; }); }); max = max || 1;
    var W = 560, H = 240, pad = 34, iw = W - pad * 2, ih = H - pad * 2;
    var body = "", legend = "";
    series.forEach(function (s, si) {
      var col = C[si % C.length];
      if (ch.kind === "bar") {
        var bw = iw / Math.max(1, x.length) / Math.max(1, series.length) * 0.7;
        s.values.forEach(function (v, i) {
          var gx = pad + (i + 0.5) * (iw / Math.max(1, x.length)) - bw * series.length / 2 + si * bw;
          var bh = v / max * ih;
          body += '<rect x="' + gx.toFixed(1) + '" y="' + (pad + ih - bh).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '" fill="' + col + '" rx="2"/>';
        });
      } else {
        var pts = s.values.map(function (v, i) { return (pad + (x.length === 1 ? iw / 2 : i / (x.length - 1) * iw)).toFixed(1) + "," + (pad + ih - v / max * ih).toFixed(1); });
        body += '<polyline fill="none" stroke="' + col + '" stroke-width="2.5" points="' + pts.join(" ") + '"/>';
        s.values.forEach(function (v, i) { var p = pts[i].split(","); body += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3" fill="' + col + '"/>'; });
      }
      legend += '<span><i style="background:' + col + '"></i>' + esc(s.name) + "</span>";
    });
    var grid = "";
    for (var g = 0; g <= 4; g++) { var gy = pad + ih - g / 4 * ih; grid += '<line x1="' + pad + '" y1="' + gy.toFixed(1) + '" x2="' + (pad + iw) + '" y2="' + gy.toFixed(1) + '" stroke="#E6E1F0"/><text x="4" y="' + (gy + 4).toFixed(1) + '" font-size="10" fill="#6B6585">' + Math.round(max * g / 4) + "</text>"; }
    var xl = x.map(function (t, i) { var gx = pad + (x.length === 1 ? iw / 2 : i / (x.length - 1) * iw); return '<text x="' + gx.toFixed(1) + '" y="' + (H - 12) + '" font-size="10" fill="#6B6585" text-anchor="middle">' + esc(t) + "</text>"; }).join("");
    return '<figure class="ch-fig"><figcaption>' + esc(ch.title) + (ch.unit ? " (" + esc(ch.unit) + ")" : "") + '</figcaption><svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="240">' + grid + body + xl + '</svg><div class="ch-leg">' + legend + "</div></figure>";
  }

  /* ---------- question groups ---------- */
  function renderGroups(groups, answers, onAnswer) {
    var html = "";
    groups.forEach(function (g) {
      html += '<div class="grp"><div class="grp-h"><b>' + esc(g.title) + '</b><span>' + esc(g.instructions) + "</span></div>";
      g.questions.forEach(function (q) {
        html += '<div class="q" data-q="' + q.id + '"><div class="q-p">' + esc(q.prompt) + '<em class="q-hint">' + kindLabel(q) + "</em></div>";
        if (q.kind === "tfng" || q.kind === "ynng") {
          var opts = q.kind === "tfng" ? ["TRUE", "FALSE", "NOT GIVEN"] : ["YES", "NO", "NOT GIVEN"];
          html += '<div class="opts v3">' + opts.map(function (o) { return '<button type="button" class="opt" data-v="' + o + '">' + o + "</button>"; }).join("") + "</div>";
        } else if (q.kind === "mcq") {
          html += '<div class="opts">' + (q.options || []).map(function (o) { var L = mcqLetter(o); return '<button type="button" class="opt" data-v="' + L + '"><span class="key">' + L + "</span>" + esc(mcqText(o)) + "</button>"; }).join("") + "</div>";
        } else {
          html += '<input class="gap-in" type="text" autocomplete="off" placeholder="…" data-v="' + q.id + '" aria-label="Ответ">';
        }
        html += "</div>";
      });
      html += "</div>";
    });
    // wire
    var root = el("div", "groups", html);
    root.querySelectorAll(".q").forEach(function (qEl) {
      var qid = qEl.dataset.q;
      qEl.querySelectorAll(".opt").forEach(function (b) {
        b.addEventListener("click", function () { qEl.querySelectorAll(".opt").forEach(function (x) { x.classList.remove("on"); }); b.classList.add("on"); onAnswer(qid, b.dataset.v); });
      });
      var inp = qEl.querySelector(".gap-in"); if (inp) inp.addEventListener("input", function () { onAnswer(qid, inp.value); });
    });
    return root;
  }

  function applyAnswers(root, answers) {
    root.querySelectorAll(".q").forEach(function (qEl) {
      var qid = qEl.dataset.q, v = answers[qid];
      if (v == null) return;
      var inp = qEl.querySelector(".gap-in"); if (inp) { inp.value = v; return; }
      qEl.querySelectorAll(".opt").forEach(function (b) { b.classList.toggle("on", b.dataset.v === v); });
    });
  }
  function markAnswers(root, groups, answers) {
    var map = {}; groups.forEach(function (g) { g.questions.forEach(function (q) { map[q.id] = q; }); });
    var res = { correct: 0, total: 0 };
    root.querySelectorAll(".q").forEach(function (qEl) {
      var qid = qEl.dataset.q, q = map[qid]; if (!q) return;
      res.total++;
      var ok = isCorrect(q, answers[qid]); if (ok) res.correct++;
      qEl.classList.add(ok ? "ok" : "bad");
      qEl.querySelectorAll(".opt").forEach(function (b) { if ((q.answer || []).map(norm).indexOf(norm(b.dataset.v)) >= 0) b.classList.add("right"); else if (b.classList.contains("on")) b.classList.add("wrong"); b.disabled = true; });
      var inp = qEl.querySelector(".gap-in"); if (inp) inp.disabled = true;
      var exp = el("div", "why", "💡 " + esc(q.why || "")); qEl.appendChild(exp);
    });
    return res;
  }

  /* ---------- audio (Web Speech) for listening ---------- */
  var VOICES = [];
  function pickVoices() { if (!("speechSynthesis" in w)) return; VOICES = w.speechSynthesis.getVoices().filter(function (v) { return /^en/i.test(v.lang); }); }
  if ("speechSynthesis" in w) { pickVoices(); w.speechSynthesis.onvoiceschanged = pickVoices; }
  function voiceFor(kind, i) { if (!VOICES.length) return null; var g1 = VOICES.filter(function (v) { return /en[-_]GB/i.test(v.lang); }); var g2 = VOICES.filter(function (v) { return /en[-_]US/i.test(v.lang); }); var pool = g2.concat(g1).length ? g2.concat(g1) : VOICES; var female = /female/.test(kind); var want = pool.filter(function (v) { return /female|samantha|zira|karen|moira|serena|kate|victoria|aria|jenny/i.test(v.name) === female; }); var arr = want.length ? want : pool; return arr[i % arr.length]; }
  function speakLines(lines, speakers, onDone, onLine) {
    if (!("speechSynthesis" in w)) { onDone(); return function () {}; }
    w.speechSynthesis.cancel();
    var idx = 0, cancelled = false;
    function next() {
      if (cancelled || idx >= lines.length) { onDone(); return; }
      var ln = lines[idx], sp = speakers[ln.speaker] || {};
      var u = new SpeechSynthesisUtterance(ln.text); u.lang = "en-GB"; var v = voiceFor(sp.voice || "female", ln.speaker === "B" ? 1 : 0); if (v) u.voice = v; u.rate = 0.97;
      if (onLine) onLine(idx);
      u.onend = function () { idx++; setTimeout(next, 220); };
      u.onerror = function () { idx++; setTimeout(next, 120); };
      w.speechSynthesis.speak(u);
    }
    next();
    return function () { cancelled = true; w.speechSynthesis.cancel(); };
  }

  /* ---------- timer bar ---------- */
  function makeTimer(minutes, onEnd) {
    var left = minutes * 60, t0 = Date.now(), bar = el("span", "tmr", "0:00"), iv = null, dead = false;
    function tick() {
      var s = left - Math.floor((Date.now() - t0) / 1000);
      if (s <= 0) { bar.textContent = "0:00"; if (!dead) { dead = true; clearInterval(iv); onEnd && onEnd(); } return; }
      bar.textContent = Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
      bar.classList.toggle("low", s <= 60);
    }
    tick(); iv = setInterval(tick, 1000);
    return { bar: bar, stop: function () { clearInterval(iv); } };
  }

  /* ---------- views ---------- */
  function backLink(href, label) { return '<a class="lnk" href="' + href + '">← ' + esc(label || "Назад") + "</a>"; }
  function renderHome() {
    d.title = "IELTS — Lexi";
    var tabs = [["reading", "Reading", D.reading.length], ["listening", "Listening", D.listening.length], ["writing", "Writing", D.writing.length], ["speaking", "Speaking", D.speaking.length]];
    app.innerHTML = '<div class="wrap"><div class="hd"><h1>IELTS тренажёр</h1><p>Задания в формате экзамена: Reading и Listening с проверкой и разбором, Writing с примерами Band 8–9, Speaking с таймерами.</p></div>' +
      '<div class="tabs" id="tabs">' + tabs.map(function (t, i) { return '<button data-tab="' + t[0] + '" class="' + (i === 0 ? "on" : "") + '">' + t[1] + ' <em>' + t[2] + "</em></button>"; }).join("") + '</div><div id="list" class="list"></div></div>';
    function draw(tab) {
      var L = $("#list"); var data = D[tab] || [];
      if (tab === "reading" || tab === "listening") {
        L.innerHTML = data.map(function (t) {
          var qn = allQ(t.groups);
          return '<a class="row" href="#/' + tab + "/" + t.id + '"><span class="em">' + (tab === "reading" ? "📖" : "🎧") + '</span><span class="tx"><b>' + esc(t.title) + '</b><small>' + esc(t.topic || t.context || "") + " · " + qn + " вопросов · " + t.minutes + ' мин · ' + esc((t.format === "general" ? "General" : t.format === "academic" ? "Academic" : "Part " + t.part)) + '</small></span><span class="ar">›</span></a>';
        }).join("");
      } else if (tab === "writing") {
        L.innerHTML = data.map(function (t) {
          return '<a class="row" href="#/writing/' + t.id + '"><span class="em">✍️</span><span class="tx"><b>' + esc(t.type) + ' · ' + (t.task === "task1" ? "Task 1" : "Task 2") + '</b><small>' + t.minWords + " слов · " + t.minutes + " мин · " + esc(t.format === "both" ? "Academic/General" : t.format) + '</small></span><span class="ar">›</span></a>';
        }).join("");
      } else {
        L.innerHTML = data.map(function (t) {
          return '<a class="row" href="#/speaking/' + t.id + '"><span class="em">🗣</span><span class="tx"><b>Part ' + t.part + " · " + esc(t.topic) + '</b><small>' + t.questions.length + " вопрос(ов)</small></span><span class=\"ar\">›</span></a>";
        }).join("");
      }
    }
    $("#tabs").addEventListener("click", function (e) { var b = e.target.closest("[data-tab]"); if (!b) return; $("#tabs").querySelectorAll("button").forEach(function (x) { x.classList.toggle("on", x === b); }); draw(b.dataset.tab); });
    draw("reading");
  }

  var session = null, cancelSpeak = null;
  function renderReading(t) {
    d.title = t.title + " — Reading";
    var answers = loadAns("reading", t.id);
    app.innerHTML = '<div class="wrap">' + backLink("#/") +
      '<div class="bar2"><span class="bt">' + esc(t.title) + '</span><span class="meta">' + esc(t.topic) + " · " + allQ(t.groups) + ' вопросов</span><span id="tmrhost"></span></div>' +
      '<div class="split"><article class="passage"><h2>' + esc(t.passage.heading) + '</h2>' + t.passage.paragraphs.map(function (p, i) { return '<p><span class="plab">' + String.fromCharCode(65 + i) + '</span>' + esc(p) + "</p>"; }).join("") + '</article><section class="qs" id="qs"></section></div>' +
      '<div class="foot"><span id="prog"></span><button class="btn p" id="check">Проверить ответы</button></div>' +
      '<div id="res"></div></div>';
    var root = renderGroups(t.groups, answers, function (qid, v) { answers[qid] = v; saveAns("reading", t.id, answers); updateProg(); });
    $("#qs").appendChild(root); applyAnswers(root, answers);
    var timer = makeTimer(t.minutes, submit);
    $("#tmrhost").appendChild(timer.bar);
    function answeredCount() { return Object.keys(answers).filter(function (k) { return String(answers[k] || "").trim(); }).length; }
    function updateProg() { $("#prog").textContent = "Отвечено " + answeredCount() + " / " + allQ(t.groups); }
    updateProg();
    function submit() {
      timer.stop(); var res = markAnswers(root, t.groups, answers);
      var band = bandFromPractice("reading", res.correct, res.total, t.format);
      $("#check").style.display = "none";
      $("#res").innerHTML = resultCard(res, band, "reading");
      $("#res").scrollIntoView({ behavior: "smooth" });
    }
    $("#check").addEventListener("click", submit);
  }

  function renderListening(t) {
    d.title = t.title + " — Listening";
    var answers = loadAns("listening", t.id);
    var transcript = t.script.map(function (l) { var sp = t.speakers[l.speaker] || {}; return '<p><b>' + esc(sp.name || l.speaker) + ":</b> " + esc(l.text) + "</p>"; }).join("");
    app.innerHTML = '<div class="wrap">' + backLink("#/") +
      '<div class="bar2"><span class="bt">' + esc(t.title) + '</span><span class="meta">Part ' + t.part + " · " + allQ(t.groups) + ' вопросов</span><span id="tmrhost"></span></div>' +
      '<div class="audio"><button class="play" id="play">▶ Слушать</button><button class="lnk" id="trbtn">Показать текст</button><div id="tr" class="tr" hidden>' + transcript + "</div></div>" +
      '<section class="qs" id="qs"></section>' +
      '<div class="foot"><span id="prog"></span><button class="btn p" id="check">Проверить ответы</button></div><div id="res"></div></div>';
    var root = renderGroups(t.groups, answers, function (qid, v) { answers[qid] = v; saveAns("listening", t.id, answers); updateProg(); });
    $("#qs").appendChild(root); applyAnswers(root, answers);
    var timer = makeTimer(t.minutes, submit); $("#tmrhost").appendChild(timer.bar);
    function answeredCount() { return Object.keys(answers).filter(function (k) { return String(answers[k] || "").trim(); }).length; }
    function updateProg() { $("#prog").textContent = "Отвечено " + answeredCount() + " / " + allQ(t.groups); }
    updateProg();
    var playing = false;
    $("#play").addEventListener("click", function () {
      if (playing) { if (cancelSpeak) cancelSpeak(); playing = false; $("#play").textContent = "▶ Слушать"; return; }
      playing = true; $("#play").textContent = "■ Остановить";
      cancelSpeak = speakLines(t.script, t.speakers, function () { playing = false; var b = $("#play"); if (b) b.textContent = "▶ Слушать"; });
    });
    $("#trbtn").addEventListener("click", function () { var x = $("#tr"); x.hidden = !x.hidden; this.textContent = x.hidden ? "Показать текст" : "Скрыть текст"; });
    function submit() {
      timer.stop(); if (cancelSpeak) cancelSpeak(); var res = markAnswers(root, t.groups, answers);
      var band = bandFromPractice("listening", res.correct, res.total, "academic");
      $("#check").style.display = "none";
      $("#res").innerHTML = resultCard(res, band, "listening");
      $("#res").scrollIntoView({ behavior: "smooth" });
    }
    $("#check").addEventListener("click", submit);
  }

  function resultCard(res, band, section) {
    var pct = res.total ? Math.round(res.correct / res.total * 100) : 0;
    return '<div class="result"><div class="ring"><b>' + res.correct + "/" + res.total + '</b><small>' + pct + '%</small></div>' +
      '<div class="rb"><h3>Результат</h3><p>Правильно: <b>' + res.correct + "</b> из " + res.total + '</p>' +
      '<p class="band">Прогноз IELTS Band: <b>' + fmt(band) + "</b></p>" +
      '<p class="s">Разбор каждого вопроса — ниже, под заданиями. Неверно отмечено красным, верный ответ — зелёным.</p>' +
      '<a class="btn" href="#/">← К списку тестов</a></div></div>';
  }

  function renderWriting(t) {
    d.title = t.type + " — Writing";
    var min = t.minWords || 250;
    app.innerHTML = '<div class="wrap">' + backLink("#/") +
      '<div class="bar2"><span class="bt">' + (t.task === "task1" ? "Task 1" : "Task 2") + " · " + esc(t.type) + '</span><span class="meta">' + min + " слов · " + t.minutes + ' мин</span><span id="tmrhost"></span></div>' +
      '<div class="card"><div class="prompt">' + esc(t.text).replace(/\n/g, "<br>") + "</div>" + (t.chart ? '<div class="chart">' + chartSvg(t.chart) + "</div>" : "") + "</div>" +
      '<textarea id="ta" class="ta" placeholder="Напиши ответ здесь…"></textarea>' +
      '<div class="foot"><span id="wc">0 слов</span><button class="btn" id="ai">🤖 ИИ-разбор</button><button class="btn p" id="done">Показать пример Band 8–9</button></div>' +
      '<div id="aires"></div><div id="model"></div></div>';
    var timer = makeTimer(t.minutes, function () {});
    $("#tmrhost").appendChild(timer.bar);
    var ta = $("#ta");
    ta.addEventListener("input", function () { var n = (ta.value.trim().match(/\S+/g) || []).length; var wc = $("#wc"); wc.textContent = n + " слов" + (n < min ? " · нужно минимум " + min : " ✓"); wc.classList.toggle("ok", n >= min); });
    $("#done").addEventListener("click", function () {
      timer.stop();
      $("#model").innerHTML = '<div class="model"><h3>Пример ответа (Band 8–9)</h3><div>' + esc(t.model || "").replace(/\n/g, "<br>") + "</div></div>";
      $("#model").scrollIntoView({ behavior: "smooth" });
    });
    $("#ai").addEventListener("click", function () {
      var host = $("#aires"), text = ta.value;
      if ((text.trim().match(/\S+/g) || []).length < 15) { host.innerHTML = '<div class="card">Напиши хотя бы ~15 слов, чтобы ИИ-разбор был осмысленным.</div>'; return; }
      host.innerHTML = '<div class="card">Разбираем твой ответ…</div>';
      examCall({ kind: "writing", task: t.task, format: t.format, prompt: t.text, chart: t.chart, text: text, words: (text.trim().match(/\S+/g) || []).length })
        .then(function (r) { renderExaminer(host, r.examiner); host.scrollIntoView({ behavior: "smooth" }); })
        .catch(function (e) { host.innerHTML = '<div class="card">' + (e && e.code === "auth" ? "Войди в аккаунт, чтобы получить разбор ИИ." : "Не удалось получить разбор, попробуй ещё.") + "</div>"; });
    });
  }

  function renderSpeaking(t) {
    d.title = "Speaking Part " + t.part;
    var html = '<div class="wrap">' + backLink("#/") + '<div class="bar2"><span class="bt">Speaking · Part ' + t.part + '</span><span class="meta">' + esc(t.topic) + '</span></div>';
    html += '<div class="card spk"><div class="cue">' + t.questions.map(function (q) { return "<p>" + esc(q).replace(/\n/g, "<br>") + "</p>"; }).join("") + "</div>";
    if (t.part === 2) html += '<p class="s">Подготовка ~1 мин, ответ ~2 мин. Используй таймеры ниже.</p>';
    html += '<div class="spk-timers">' + (t.prepSeconds ? '<button class="btn" data-sec="' + t.prepSeconds + '">Подготовка ' + t.prepSeconds + 'с</button>' : "") + (t.answerSeconds ? '<button class="btn p" data-sec="' + t.answerSeconds + '">Ответ ' + t.answerSeconds + "с</button>" : "") + '</div><div id="spkt" class="spkt">—</div></div>';
    html += '<div class="card"><b>Напиши, что ты сказал(а)</b><p class="s">Введи ответ по-английски на каждый вопрос — ИИ-экзаменатор оценит по критериям IELTS (пунктуация не важна).</p>' + t.questions.map(function (q, i) { return '<label class="spk-q"><small>Q' + (i + 1) + '</small><textarea class="ta spk-ta" data-i="' + i + '" placeholder="Твой ответ…"></textarea></label>'; }).join("") + '<button class="btn p" id="spk-ai">🤖 ИИ-разбор</button><div id="spk-res"></div></div></div>';
    app.innerHTML = html;
    var iv = null;
    app.querySelectorAll("[data-sec]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (iv) clearInterval(iv);
        var left = +b.dataset.sec, host = $("#spkt");
        function tick() { host.textContent = Math.floor(left / 60) + ":" + ("0" + (left % 60)).slice(-2); host.classList.toggle("low", left <= 10); if (left <= 0) { clearInterval(iv); host.textContent = "Готово ✓"; w.speechSynthesis && w.speechSynthesis.cancel(); } left--; }
        tick(); iv = setInterval(tick, 1000);
      });
    });
    $("#spk-ai").addEventListener("click", function () {
      var host = $("#spk-res");
      var parts = t.questions.map(function (q, i) { var ta = app.querySelector('.spk-ta[data-i="' + i + '"]'); return { question: String(q).replace(/\n/g, " "), text: (ta && ta.value) || "", seconds: t.answerSeconds || 0 }; });
      if (!parts.some(function (p) { return p.text.trim().length > 3; })) { host.innerHTML = '<div class="card">Напиши ответ хотя бы на один вопрос.</div>'; return; }
      host.innerHTML = '<div class="card">Разбираем твой ответ…</div>';
      examCall({ kind: "speaking", part: t.part, topic: t.topic, parts: parts, wpm: 0, fillers: 0 })
        .then(function (r) { renderExaminer(host, r.examiner); host.scrollIntoView({ behavior: "smooth" }); })
        .catch(function (e) { host.innerHTML = '<div class="card">' + (e && e.code === "auth" ? "Войди в аккаунт, чтобы получить разбор ИИ." : "Не удалось получить разбор, попробуй ещё.") + "</div>"; });
    });
  }

  /* ---------- answer persistence ---------- */
  function akey(sec, id) { return "lexy-ielts-ans-" + sec + "-" + id; }
  function loadAns(sec, id) { try { return JSON.parse(sessionStorage.getItem(akey(sec, id)) || "{}"); } catch (e) { return {}; } }
  function saveAns(sec, id, a) { try { sessionStorage.setItem(akey(sec, id), JSON.stringify(a)); } catch (e) {} }

  /* ---------- router ---------- */
  function route() {
    if (cancelSpeak) { cancelSpeak(); cancelSpeak = null; }
    if ("speechSynthesis" in w) w.speechSynthesis.cancel();
    var h = (location.hash || "#/").replace(/^#\/?/, ""), parts = h.split("/").filter(Boolean);
    var section = parts[0], id = parts[1];
    if (!section) { renderHome(); w.scrollTo(0, 0); return; }
    var t = (D[section] || []).filter(function (x) { return x.id === id; })[0];
    if (!t) { renderHome(); w.scrollTo(0, 0); return; }
    if (section === "reading") renderReading(t);
    else if (section === "listening") renderListening(t);
    else if (section === "writing") renderWriting(t);
    else if (section === "speaking") renderSpeaking(t);
    w.scrollTo(0, 0);
  }
  w.addEventListener("hashchange", route);
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", route); else route();
})(window, document);
