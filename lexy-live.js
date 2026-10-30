/* ==========================================================
   lexy-live.js — живой голосовой звонок с Lexi (порт LexiUp)
   Токен берётся у нашей edge-функции live-session, аудио идёт
   на сервис lexy.ghostlynex.fun (/live/rtc → WebRTC, /live/ws → PCM).
   Экран: настройка характера/голоса/темы, звонок, субтитры, разбор.
   ========================================================== */
(function (w, d) {
  "use strict";
  if (w.LexiLive) return;

  var LIVE_HOST = (w.LEXY_LIVE && w.LEXY_LIVE.host) || "lexy.ghostlynex.fun";
  var PERSONAS = [
    { id: "classic", name: "Лекси", tag: "Живой, весёлый и честный", voice: "Zephyr" },
    { id: "strict", name: "Строгий экзаменатор", tag: "Жёсткая мотивация, честно", voice: "Kore" },
    { id: "kind", name: "Добрый", tag: "Тёплый и поддерживающий", voice: "Sulafat" },
    { id: "sarcastic", name: "Саркастичный", tag: "Колкий юмор", voice: "Puck" },
    { id: "roast", name: "Прожарка", tag: "Роастит, но научит", voice: "Fenrir" },
    { id: "bro", name: "Кореш", tag: "Болтает как друг, на сленге", voice: "Zubenelgenubi" },
    { id: "drama", name: "Драма-квин", tag: "Переживает каждый ответ", voice: "Laomedeia" }
  ];
  var VOICES = ["Zephyr", "Kore", "Leda", "Aoede", "Callirrhoe", "Autonoe", "Despina", "Erinome", "Laomedeia", "Gacrux", "Pulcherrima", "Vindemiatrix", "Sulafat", "Puck", "Charon", "Fenrir", "Orus", "Enceladus", "Iapetus", "Umbriel", "Algieba", "Rasalgethi", "Alnilam", "Schedar", "Achird", "Sadachbia", "Sadaltager"];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function cfg() { return w.LEXY_SUPABASE || {}; }
  function token() { return (w.LexyAuth && w.LexyAuth.token) ? w.LexyAuth.token() : Promise.resolve(null); }

  function css() {
    if (d.getElementById("lxl-css")) return;
    var s = d.createElement("style"); s.id = "lxl-css";
    s.textContent =
      ".lxl-ov{position:fixed;inset:0;z-index:120;background:rgba(12,8,22,.66);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto}" +
      ".lxl{width:min(680px,100%);background:#140f24;color:#fff;border-radius:28px;padding:22px;box-shadow:0 40px 90px -40px rgba(0,0,0,.8);position:relative}" +
      ".lxl-x{position:absolute;top:14px;right:14px;width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.1);color:#fff;font-size:18px;display:grid;place-items:center}" +
      ".lxl h3{font:800 22px var(--display);margin-bottom:4px}.lxl .sub{color:rgba(255,255,255,.65);font-size:13.5px;margin-bottom:14px}" +
      ".lxl .sec{font:700 12px var(--display);letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.5);margin:16px 0 8px}" +
      ".lxl .chips{display:flex;flex-wrap:wrap;gap:8px}.lxl .chip{padding:9px 13px;border-radius:999px;background:rgba(255,255,255,.08);border:1.5px solid rgba(255,255,255,.14);font:600 13px var(--body);color:#fff}.lxl .chip.on{background:#ff6a2b;border-color:#ff6a2b;color:#1b1433}" +
      ".lxl .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.lxl input,.lxl select{background:rgba(255,255,255,.08);border:1.5px solid rgba(255,255,255,.16);color:#fff;border-radius:12px;padding:11px 13px;font:500 14px var(--body)}.lxl input::placeholder{color:rgba(255,255,255,.4)}" +
      ".lxl .go{margin-top:20px;width:100%;padding:15px;border-radius:16px;background:#ff6a2b;color:#1b1433;font:800 16px var(--display)}" +
      ".lxl-stage{display:none}.lxl-stage.on{display:block}.lxl-set{display:none}.lxl-set.on{display:block}" +
      ".lxl-face{width:200px;margin:6px auto 0}" +
      ".lxl-status{text-align:center;color:#ffb27a;font-weight:700;font-size:14px;margin-top:6px}" +
      ".lxl-cap{min-height:60px;text-align:center;margin:12px auto 0;max-width:56ch;font-size:17px;line-height:1.5}" +
      ".lxl-me{text-align:center;color:rgba(255,255,255,.6);font-size:13.5px;margin-top:6px}" +
      ".lxl-ctl{display:flex;justify-content:center;gap:12px;margin-top:16px}" +
      ".lxl-mute{width:64px;height:64px;border-radius:50%;background:#ff6a2b;color:#1b1433;font-size:26px;display:grid;place-items:center}.lxl-mute.off{background:rgba(255,255,255,.15);color:rgba(255,255,255,.7)}" +
      ".lxl-end{height:64px;padding:0 20px;border-radius:999px;background:#e5484d;color:#fff;font-weight:800;display:grid;place-items:center}" +
      ".lxl-tool{width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.1);color:#fff;font-size:22px;display:grid;place-items:center}" +
      ".lxl-type{display:none;gap:8px;margin-top:12px}.lxl-type.on{display:flex}.lxl-type input{flex:1}.lxl-type button{width:48px;border-radius:12px;background:#ff6a2b;color:#1b1433;font-size:18px}" +
      ".lxl-tr{margin-top:16px;max-height:230px;overflow:auto;display:grid;gap:8px}.lxl-tr .m{max-width:88%;padding:10px 13px;border-radius:16px;font-size:14px;line-height:1.5}.lxl-tr .u{background:#3a2214;margin-left:auto}.lxl-tr .a{background:rgba(255,255,255,.08)}" +
      ".lxl-note{text-align:center;color:#ff9a9a;font-size:13px;margin-top:10px}" +
      ".lxl-fix{display:block;margin-top:5px;font-size:12.5px;color:rgba(255,255,255,.65)}.lxl-fix b{color:#39d98a}" +
      "[data-theme='dark'] .lxl{background:#140f24}";
    d.head.appendChild(s);
  }

  function overlay() {
    var ov = d.createElement("div"); ov.className = "lxl-ov";
    ov.innerHTML = '<div class="lxl" role="dialog" aria-modal="true"><button class="lxl-x" aria-label="Закрыть">✕</button>' +
      '<div class="lxl-set on" id="lxlSet"><h3>Живой разговор с Lexi</h3><p class="sub">Настоящий голосовой звонок. Lexi слушает, отвечает голосом и поправляет ошибки по ходу. Выбери характер, голос и тему.</p>' +
        '<div class="sec">Характер</div><div class="chips" id="lxlP">' + PERSONAS.map(function (p, i) { return '<button class="chip' + (i === 0 ? " on" : "") + '" data-p="' + p.id + '" data-v="' + p.voice + '">' + p.name + "</button>"; }).join("") + '</div>' +
        '<div class="sec">Голос</div><div class="row"><select id="lxlV">' + VOICES.map(function (v) { return '<option>' + v + "</option>"; }).join("") + '</select>' +
        '<div class="chips"><button class="chip" id="lxlLang">Язык: микс RU/EN</button><button class="chip" id="lxlSwear">Без мата</button></div></div>' +
        '<div class="sec">Тема (необязательно)</div><input id="lxlT" placeholder="Например: путешествия, работа, хобби…" maxlength="80" style="width:100%">' +
        '<button class="go" id="lxlStart">Начать разговор</button><div class="lxl-note" id="lxlErr"></div></div>' +
      '<div class="lxl-stage" id="lxlStage"><div class="row" style="justify-content:space-between"><div><b>Lexi</b><div class="sub" id="lxlWho" style="margin:0"></div></div><button class="lxl-tool" id="lxlSub" title="Субтитры">CC</button></div>' +
        '<div class="lxl-face" id="lxlFace"></div><div class="lxl-status" id="lxlStat">Соединяю…</div>' +
        '<div class="lxl-cap" id="lxlCap"></div><div class="lxl-me" id="lxlMe"></div>' +
        '<div class="lxl-ctl"><button class="lxl-tool" id="lxlKb" title="Написать">⌨</button><button class="lxl-mute" id="lxlMute" title="Микрофон">🎙</button><button class="lxl-end" id="lxlEnd">Завершить</button></div>' +
        '<div class="lxl-type" id="lxlType"><input id="lxlIn" placeholder="Напиши ответ…" maxlength="800"><button id="lxlSend">➤</button></div>' +
        '<div class="lxl-tr" id="lxlTr"></div><div class="lxl-note" id="lxlNote"></div></div></div>';
    d.body.appendChild(ov);
    return ov;
  }

  var ov, link = null, lines = [], sub = true, muted = false, leaving = false, setup = { persona: "classic", voice: "Zephyr", lang: "mix", swear: false, topic: "" };

  function $(s) { return ov.querySelector(s); }
  function addLine(role, text, fix) { lines.push({ role: role, text: text, fix: fix || null }); paintTr(); }
  function paintTr() {
    var tr = $("#lxlTr"); if (!tr) return;
    tr.innerHTML = lines.map(function (l) {
      var inner = esc(l.text);
      if (l.fix && l.fix.wrong) { var i = l.text.toLowerCase().indexOf(l.fix.wrong.toLowerCase()); if (i >= 0) inner = esc(l.text.slice(0, i)) + '<span style="text-decoration:line-through;color:#ff8a8a">' + esc(l.text.slice(i, i + l.fix.wrong.length)) + "</span> <b style='color:#39d98a'>" + esc(l.fix.right) + "</b>" + esc(l.text.slice(i + l.fix.wrong.length)); }
      return '<div class="m ' + (l.role === "user" ? "u" : "a") + '">' + inner + (l.fix && l.fix.why ? '<span class="lxl-fix">' + esc(l.fix.why) + "</span>" : "") + "</div>";
    }).join("");
    tr.scrollTop = tr.scrollHeight;
  }

  function closeAll() { try { if (link) link.close(); } catch (e) {} link = null; if (ov && ov.parentNode) ov.parentNode.removeChild(ov); ov = null; }

  function start() {
    var e = $("#lxlErr"); e.textContent = "Соединяю…";
    token().then(function (t) {
      if (!t) { e.textContent = "Войди в аккаунт, чтобы позвонить Lexi."; return; }
      var c = cfg(), base = String(c.url || "").replace(/\/+$/, "");
      return fetch(base + "/functions/v1/live-session", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + t, apikey: c.anonKey || "" }, body: JSON.stringify({ start: setup }) })
        .then(function (r) { return r.text().then(function (tx) { var dd = null; try { dd = tx ? JSON.parse(tx) : null; } catch (x) {} return { ok: r.ok, d: dd }; }); });
    }).then(function (res) {
      if (!res) return;
      if (!res.ok || !res.d || !res.d.token) { e.textContent = "Живой звонок сейчас недоступен. Попробуй позже."; return; }
      goLive(res.d.token);
    }).catch(function () { e.textContent = "Не удалось начать звонок."; });
  }

  function goLive(tok) {
    $("#lxlSet", ov).classList.remove("on");
    $("#lxlStage", ov).classList.add("on");
    $("#lxlWho", ov).textContent = (PERSONAS.filter(function (p) { return p.id === setup.persona; })[0] || {}).name || "Лекси";
    if (w.LexiSpirit && $("#lxlFace")) { try { w.LexiSpirit.mount($("#lxlFace")); } catch (x) {} }
    connectLive({ token: tok,
      onEvent: function (ev) { onEvent(ev); },
      onDrop: function () { $("#lxlNote", ov).textContent = "Связь прервалась."; }
    }).then(function (l) { link = l; $("#lxlStat", ov).textContent = "Говори, я слушаю"; })
      .catch(function (err) {
        try { console.warn("lexi live connect failed:", err && (err.message || err)); } catch (e) {}
        var n = err && err.name;
        if (n === "NotAllowedError") $("#lxlNote", ov).textContent = "Разреши доступ к микрофону.";
        else if (n === "NotFoundError") $("#lxlNote", ov).textContent = "Микрофон не найден.";
        else $("#lxlNote", ov).textContent = "Не удалось подключиться к голосу Lexi.";
      });
  }

  function onEvent(ev) {
    if (!ov) return;
    if (ev.t === "ready") $("#lxlStat", ov).textContent = "Говори, я слушаю";
    else if (ev.t === "say") { $("#lxlCap", ov).textContent = ev.text || ""; $("#lxlStat", ov).textContent = "Lexi говорит…"; }
    else if (ev.t === "heard") $("#lxlMe", ov).textContent = "Ты: " + (ev.text || "");
    else if (ev.t === "turn") { if (ev.heard) addLine("user", ev.heard, ev.fix); if (ev.said) addLine("lexi", ev.said); $("#lxlMe", ov).textContent = ""; $("#lxlCap", ov).textContent = ""; }
    else if (ev.t === "fix") { var f = ev.fix, i = lines.map(function (l) { return l.role; }).lastIndexOf("user"); if (i >= 0) { lines[i].fix = f; paintTr(); } }
    else if (ev.t === "end") { $("#lxlStat", ov).textContent = "Звонок завершён"; }
    else if (ev.t === "error") $("#lxlNote", ov).textContent = "Lexi пропала со связи.";
  }

  /* ---------- соединение (порт live-client.ts) ---------- */
  var ICE = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"] }];
  var MIC = { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 };
  function AC() { var A = w.AudioContext || w.webkitAudioContext; return new A(); }
  function connectLive(o) {
    return navigator.mediaDevices.getUserMedia({ audio: MIC }).then(function (stream) {
      // Cross-origin (our static site → their live host): WebRTC needs a cross-origin POST
      // to /live/rtc which CORS blocks, so go straight to the WebSocket (not CORS-restricted).
      var cross = location.host !== LIVE_HOST;
      if (!cross && typeof RTCPeerConnection !== "undefined") return connectRtc(o, stream).catch(function (e) { console.warn("lexi live: rtc failed", e); return connectWs(o, stream); });
      return connectWs(o, stream);
    });
  }
  function connectRtc(o, stream) {
    var pc = new RTCPeerConnection({ iceServers: ICE });
    stream.getAudioTracks().forEach(function (t) { pc.addTrack(t, stream); });
    var dc = pc.createDataChannel("lexi");
    var ctx = AC(); ctx.resume().catch(function () {});
    var player = new Audio(); player.autoplay = true; player.setAttribute("playsinline", "");
    pc.ontrack = function (e) { var remote = e.streams[0] || new MediaStream([e.track]); player.srcObject = remote; player.play().catch(function () {}); };
    dc.onmessage = function (m) { var ev; try { ev = JSON.parse(m.data); } catch (x) { return; } o.onEvent(ev); };
    return pc.createOffer().then(function (offer) { return pc.setLocalDescription(offer); }).then(function () {
      return new Promise(function (resolve) { if (pc.iceGatheringState === "complete") return resolve(); var t = setTimeout(resolve, 1200); pc.addEventListener("icegatheringstatechange", function () { if (pc.iceGatheringState === "complete") { clearTimeout(t); resolve(); } }); });
    }).then(function () {
      return fetch("https://" + LIVE_HOST + "/live/rtc?token=" + encodeURIComponent(o.token), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pc.localDescription) });
    }).then(function (res) { if (!res.ok) throw new Error("rtc " + res.status); return res.json(); }).then(function (ans) { return pc.setRemoteDescription(ans); }).then(function () {
      return new Promise(function (resolve, reject) { var t = setTimeout(function () { reject(new Error("rtc timeout")); }, 6000); var check = function () { if (pc.connectionState === "connected") { clearTimeout(t); resolve(); } if (pc.connectionState === "failed") { clearTimeout(t); reject(new Error("rtc failed")); } }; pc.addEventListener("connectionstatechange", check); check(); });
    }).then(function () {
      return { kind: "rtc", sendText: function (text) { if (dc.readyState === "open") dc.send(JSON.stringify({ t: "text", text: text })); }, setMuted: function (on) { stream.getAudioTracks().forEach(function (t) { t.enabled = !on; }); }, voice: function () { return { level: 0, bright: 0.5, playing: false, analysed: false }; }, mic: function () { return 0; }, playing: function () { return false; }, hush: function () {}, end: function () { return new Promise(function (r) { if (dc.readyState === "open") dc.send(JSON.stringify({ t: "end" })); stream.getTracks().forEach(function (t) { t.stop(); }); setTimeout(r, 4000); }); }, close: function () { stream.getTracks().forEach(function (t) { t.stop(); }); player.srcObject = null; pc.close(); ctx.close().catch(function () {}); } };
    });
  }
  var WORKLET = 'class LexyMic extends AudioWorkletProcessor{constructor(){super();this.ratio=sampleRate/16000;this.acc=0;this.sum=0;this.n=0;this.buf=new Int16Array(640);this.i=0;}process(inputs){const ch=inputs[0]&&inputs[0][0];if(!ch)return true;for(let k=0;k<ch.length;k++){this.sum+=ch[k];this.n++;this.acc++;if(this.acc>=this.ratio){this.acc-=this.ratio;const v=Math.max(-1,Math.min(1,this.sum/this.n));this.sum=0;this.n=0;this.buf[this.i++]=v<0?v*0x8000:v*0x7fff;if(this.i===640){this.port.postMessage(this.buf.buffer,[this.buf.buffer]);this.buf=new Int16Array(640);this.i=0;}}}return true;}}registerProcessor("lexy-mic",LexyMic);';
  function connectWs(o, stream) {
    var ctx = AC(); return ctx.resume().catch(function () {}).then(function () {
      var url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
      return ctx.audioWorklet.addModule(url).then(function () { URL.revokeObjectURL(url); });
    }).then(function () {
      var src = ctx.createMediaStreamSource(stream); var node = new AudioWorkletNode(ctx, "lexy-mic"); src.connect(node);
      var sink = ctx.createGain(); sink.gain.value = 0; node.connect(sink).connect(ctx.destination);
      var out = ctx.createAnalyser(); out.fftSize = 1024; out.connect(ctx.destination);
      var proto = "wss"; var ws = new WebSocket(proto + "://" + LIVE_HOST + "/live/ws?token=" + encodeURIComponent(o.token)); ws.binaryType = "arraybuffer";
      return new Promise(function (resolve, reject) { ws.onopen = function () { resolve(); }; ws.onerror = function () { reject(new Error("ws failed")); }; }).then(function () {
        var next = 0, sources = new Set();
        function hush() { sources.forEach(function (s) { try { s.stop(); } catch (e) {} }); sources.clear(); next = 0; }
        function playing() { return next > ctx.currentTime + 0.02; }
        function play(data) { var pcm = new Int16Array(data); if (!pcm.length) return; var buf = ctx.createBuffer(1, pcm.length, 24000); var ch = buf.getChannelData(0); for (var i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 0x8000; var s = ctx.createBufferSource(); s.buffer = buf; s.connect(out); var at = next > ctx.currentTime ? next : ctx.currentTime + 0.15; s.start(at); next = at + buf.duration; sources.add(s); s.onended = function () { sources.delete(s); }; }
        ws.onmessage = function (m) { if (m.data instanceof ArrayBuffer) return play(m.data); var ev; try { ev = JSON.parse(m.data); } catch (x) { return; } if (ev.t === "interrupted") hush(); o.onEvent(ev); };
        ws.onclose = function () { o.onDrop(); };
        var mutedF = false, floor = 0.01, voiced = 0; var ring = []; var zeros = new Int16Array(640).buffer;
        node.port.onmessage = function (m) { var frame = m.data; if (ws.readyState !== WebSocket.OPEN) return; var pcm = new Int16Array(frame), sum = 0; for (var i = 0; i < pcm.length; i++) sum += Math.pow(pcm[i] / 0x8000, 2); var rms = Math.sqrt(sum / pcm.length); ring.push(frame); if (ring.length > 8) ring.shift(); if (mutedF) return void ws.send(zeros); if (!playing()) { floor = rms < 0.02 ? floor * 0.95 + rms * 0.05 : floor; voiced = 0; return void ws.send(frame); } voiced = rms > Math.max(0.03, floor * 8) ? voiced + 40 : 0; if (voiced >= 240) { hush(); voiced = 0; ring.forEach(function (f) { ws.send(f); }); ring.length = 0; return; } ws.send(zeros); };
        return { kind: "ws", sendText: function (text) { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ t: "text", text: text })); }, setMuted: function (on) { mutedF = on; }, voice: function () { return { level: 0, bright: 0.5, playing: playing(), analysed: false }; }, mic: function () { return 0; }, playing: playing, hush: hush, end: function () { return new Promise(function (r) { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ t: "end" })); else r(); stream.getTracks().forEach(function (t) { t.stop(); }); setTimeout(r, 4000); }); }, close: function () { hush(); stream.getTracks().forEach(function (t) { t.stop(); }); try { ws.close(); } catch (e) {} ctx.close().catch(function () {}); } };
      });
    });
  }

  function open(opts) {
    css(); if (ov) return; ov = overlay();
    var persona = (opts && opts.persona) || "classic";
    ov.querySelectorAll("#lxlP .chip").forEach(function (b) { b.classList.toggle("on", b.dataset.p === persona); if (b.dataset.p === persona) { $("#lxlV", ov).value = b.dataset.v; setup.persona = b.dataset.p; setup.voice = b.dataset.v; } });
    ov.querySelector("#lxlP").addEventListener("click", function (ev) { var b = ev.target.closest(".chip"); if (!b) return; ov.querySelectorAll("#lxlP .chip").forEach(function (x) { x.classList.remove("on"); }); b.classList.add("on"); setup.persona = b.dataset.p; setup.voice = b.dataset.v; $("#lxlV", ov).value = b.dataset.v; });
    ov.querySelector("#lxlV").addEventListener("change", function () { setup.voice = this.value; });
    ov.querySelector("#lxlT").addEventListener("input", function () { setup.topic = this.value; });
    ov.querySelector("#lxlLang").addEventListener("click", function () { setup.lang = setup.lang === "en" ? "mix" : "en"; this.textContent = "Язык: " + (setup.lang === "en" ? "English" : "микс RU/EN"); });
    ov.querySelector("#lxlSwear").addEventListener("click", function () { setup.swear = !setup.swear; this.textContent = setup.swear ? "Можно мат" : "Без мата"; });
    ov.querySelector(".lxl-x").addEventListener("click", closeAll);
    ov.querySelector("#lxlStart").addEventListener("click", start);
    ov.querySelector("#lxlSub").addEventListener("click", function () { sub = !sub; this.style.opacity = sub ? "1" : ".5"; });
    ov.querySelector("#lxlKb").addEventListener("click", function () { $("#lxlType", ov).classList.toggle("on"); });
    ov.querySelector("#lxlMute").addEventListener("click", function () { muted = !muted; this.classList.toggle("off", muted); this.textContent = muted ? "🔇" : "🎙"; if (link) link.setMuted(muted); });
    ov.querySelector("#lxlEnd").addEventListener("click", function () { if (leaving) return; leaving = true; $("#lxlStat", ov).textContent = "Завершаю…"; Promise.resolve(link && link.end()).then(closeAll); });
    ov.querySelector("#lxlSend").addEventListener("click", function () { var inp = $("#lxlIn", ov); var v = (inp.value || "").trim(); if (!v || !link) return; link.hush(); link.sendText(v); addLine("user", v); inp.value = ""; });
    ov.querySelector("#lxlIn").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); $("#lxlSend", ov).click(); } });
  }

  w.LexiLive = { open: open, close: closeAll, host: LIVE_HOST };
})(window, document);
