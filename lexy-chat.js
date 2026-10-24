/* ==========================================================
   lexy-chat.js — Lexy AI: чат-практика и проверка Writing
   • Работает через Supabase Edge Function ai-chat (DeepSeek)
   • Уровень берётся из курса пользователя
   • Лимиты: письмо 2/день (Pro), 6/день (Pro+); чат по токенам
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
  function toast(t) { try { w.Lexy.toast(t); } catch (e) {} }
  var state = { tab: "chat", msgs: [], topic: "", essay: "", busy: false };

  function render(el, opts) {
    opts = opts || {};
    var level = opts.level || "B1";
    if (!el) return;
    if (!(w.Lexy.user && w.Lexy.user.premium)) { renderLock(el); return; }
    el.innerHTML = '<h1 class="t">Lexy AI</h1><p class="s">Практика разговора и письма · уровень ' + esc(level) + '</p>' +
      '<div class="seg" id="aiSeg"><button data-ai="chat" class="' + (state.tab === "chat" ? "on" : "") + '">💬 Чат</button><button data-ai="writing" class="' + (state.tab === "writing" ? "on" : "") + '">✍️ Письмо</button></div>' +
      '<div id="aiBody"></div>';
    $("#aiSeg", el).addEventListener("click", function (e) {
      var b = e.target.closest("[data-ai]"); if (!b) return;
      state.tab = b.dataset.ai;
      el.querySelectorAll("[data-ai]").forEach(function (x) { x.classList.toggle("on", x === b); });
      draw(el, level);
    });
    draw(el, level);
  }

  function renderLock(el) {
    el.innerHTML = '<h1 class="t">Lexy AI</h1><div class="card" style="text-align:center;margin-top:16px"><div style="font-size:40px">🔒</div>' +
      '<h2 style="font:800 22px var(--display);margin:10px 0">Lexy AI — Premium</h2>' +
      '<p class="s">Чат-практика английского и проверка Writing с ИИ доступны на тарифах Pro и Pro+.</p>' +
      '<a class="btn p" href="pricing.html" style="margin-top:14px">Получить Premium</a></div>';
  }

  function draw(el, level) {
    var body = $("#aiBody", el);
    if (state.tab === "chat") drawChat(body, level); else drawWriting(body, level);
  }

  function drawChat(body, level) {
    var msgs = state.msgs.map(function (m) {
      var mine = m.role === "user";
      return '<div style="display:flex;justify-content:' + (mine ? "flex-end" : "flex-start") + '"><div style="max-width:80%;background:' + (mine ? "linear-gradient(135deg,#FF5A1F,#FF9A0A)" : "#fff") + ';color:' + (mine ? "#fff" : "var(--ink)") + ';border:1px solid ' + (mine ? "transparent" : "var(--line)") + ';border-radius:16px;padding:12px 14px;font-size:14.5px;line-height:1.5;margin-top:10px">' + esc(m.content) + "</div></div>";
    }).join("");
    body.innerHTML = '<div class="card" style="margin-top:14px">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><span style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(135deg,#FFF3EC,#FFE3D2);font-size:20px">💬</span><div><b style="font:800 16px var(--display)">Поговорим по-английски</b><div class="s" style="margin:0">Отвечай собеседнику — он мягко поправит</div></div></div>' +
      '<div id="aiMsgs" style="max-height:44vh;overflow:auto;padding-bottom:6px">' + (msgs || '<p class="s" style="margin-top:10px">Напиши что-нибудь по-английски, чтобы начать 🙂</p>') + "</div>" +
      '<div style="display:flex;gap:8px;margin-top:12px"><input id="aiIn" placeholder="Type in English…" style="flex:1;padding:13px 14px;border:1.5px solid var(--line);border-radius:14px;outline:none;font:500 14.5px var(--body)"><button class="btn p" id="aiSend">' + ic("send") + "</button></div></div>";
    var msgsBox = $("#aiMsgs", body); if (msgsBox) msgsBox.scrollTop = msgsBox.scrollHeight;
    var inp = $("#aiIn", body), send = $("#aiSend", body);
    function go() {
      var text = (inp.value || "").trim(); if (!text || state.busy) return;
      state.busy = true; inp.value = ""; state.msgs.push({ role: "user", content: text }); drawChat(body, level);
      call({ mode: "chat", level: level, messages: state.msgs }).then(function (d) {
        state.busy = false;
        if (d && d.reply) state.msgs.push({ role: "assistant", content: d.reply });
        drawChat(body, level);
      }).catch(function (err) {
        state.busy = false; drawChat(body, level);
        if (err && err.code === "premium_required") toast("Нужен Premium");
        else if (err && err.code === "limit") toast("Дневной лимит чата исчерпан");
        else toast("Не удалось ответить, попробуй ещё");
      });
    }
    send.addEventListener("click", go);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
    inp.focus();
  }

  function drawWriting(body, level) {
    var res = state.result;
    var resultHtml = res ? '<div class="card" style="margin-top:14px"><div style="display:flex;align-items:center;gap:14px"><div style="font:800 44px var(--display);color:var(--fire);letter-spacing:-.04em">' + (res.band != null ? res.band : "—") + '</div><div><b style="font:800 16px var(--display)">Оценка IELTS</b><div class="s" style="margin:0">' + esc(res.summary || "") + '</div></div></div>' +
      (res.strengths && res.strengths.length ? '<div style="margin-top:12px"><b>Сильные стороны</b><ul style="margin:6px 0 0 18px;color:var(--soft);font-size:13.5px;line-height:1.6">' + res.strengths.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>" : "") +
      (res.improvements && res.improvements.length ? '<div style="margin-top:12px"><b>Что улучшить</b><ul style="margin:6px 0 0 18px;color:var(--soft);font-size:13.5px;line-height:1.6">' + res.improvements.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>" : "") +
      (res.corrections && res.corrections.length ? '<div style="margin-top:12px"><b>Замечания</b><ul style="margin:6px 0 0 18px;color:var(--soft);font-size:13.5px;line-height:1.6">' + res.corrections.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>" : "") + "</div>" : "";
    body.innerHTML = '<div class="card" style="margin-top:14px">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><span style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(135deg,#FFF3EC,#FFE3D2);font-size:20px">✍️</span><div><b style="font:800 16px var(--display)">Проверка Writing</b><div class="s" style="margin:0">ИИ-экзаменатор оценит эссе по критериям IELTS</div></div></div>' +
      '<button class="btn ghost sm" id="aiTopic">' + ic("spark") + " Получить тему</button>" +
      (state.topic ? '<div class="rd" style="margin-top:12px"><b>Тема:</b> ' + esc(state.topic) + "</div>" : "") +
      (state.topic ? '<textarea id="aiEssay" placeholder="Напиши эссе (250+ слов)…" style="margin-top:12px;min-height:200px">' + esc(state.essay) + "</textarea>" +
        '<div class="meta"><span>Слов: <b id="aiWc">0</b></span><span>Мин: <b>250</b></span></div>' +
        '<button class="btn p" id="aiCheck" style="margin-top:10px;width:100%">Проверить эссе</button>' : "") +
      resultHtml + "</div>";
    var tb = $("#aiTopic", body);
    tb.addEventListener("click", function () {
      if (state.busy) return; state.busy = true; tb.textContent = "Подбираем тему…";
      call({ mode: "writing-topic", level: level }).then(function (d) {
        state.busy = false; state.topic = (d && d.topic) || ""; state.result = null; state.essay = ""; drawWriting(body, level);
      }).catch(function (err) { state.busy = false; drawWriting(body, level); if (err && err.code === "premium_required") toast("Нужен Premium"); else toast("Не удалось получить тему"); });
    });
    var ta = $("#aiEssay", body), wc = $("#aiWc", body), chk = $("#aiCheck", body);
    if (ta) {
      function cnt() { var n = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0; wc.textContent = n; }
      cnt();
      ta.addEventListener("input", function () { state.essay = ta.value; cnt(); });
      chk.addEventListener("click", function () {
        var words = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0;
        if (words < 30) { toast("Напиши хотя бы немного текста"); return; }
        if (state.busy) return; state.busy = true; chk.disabled = true; chk.textContent = "Проверяем…";
        call({ mode: "writing-check", level: level, topic: state.topic, essay: ta.value }).then(function (d) {
          state.busy = false; state.result = (d && d.result) || null; state.essay = ta.value; drawWriting(body, level);
          toast(d && d.remaining != null ? "Проверено · осталось проверок сегодня: " + d.remaining : "Проверено");
        }).catch(function (err) {
          state.busy = false; chk.disabled = false; chk.textContent = "Проверить эссе";
          if (err && err.code === "premium_required") toast("Нужен Premium");
          else if (err && err.code === "limit") toast("Лимит проверок на сегодня исчерпан");
          else toast("Не удалось проверить, попробуй ещё");
        });
      });
    }
  }

  w.LexyChat = { render: render, call: call };
})(window);
