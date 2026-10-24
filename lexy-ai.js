/* ==========================================================
   lexy-ai.js — Lexy AI (практика Speaking для Premium)
   • Вопросы IELTS Speaking + образцы ответов + советы
   • Озвучка вопроса (браузерный голос)
   • Разбор твоего ответа: объём, структура, частые ошибки
   ========================================================== */
(function (w) {
  "use strict";

  var Q = [
    { p: "Part 1", q: "What do you usually do at the weekend?", sample: "At the weekend I usually relax at home and meet my friends. On Saturday morning I go for a walk, and in the evening we often have dinner together. It helps me to recharge after a busy week.", tips: ["Дай 2–3 предложения", "Добавь причину или пример"] },
    { p: "Part 1", q: "Do you prefer tea or coffee?", sample: "I prefer tea, especially green tea. I drink it in the afternoon because it helps me stay calm and focused. Coffee makes me nervous, so I avoid it in the evening.", tips: ["Скажи предпочтение + причину", "Используй because / so"] },
    { p: "Part 1", q: "What kind of music do you like?", sample: "I enjoy pop and some jazz. I listen to music while I study, but only instrumental tracks, because lyrics distract me. Jazz is my favourite when I want to relax.", tips: ["Назови 1–2 жанра", "Объясни когда/почему"] },
    { p: "Part 1", q: "Is your hometown a good place to live?", sample: "Yes, I think so. My hometown is not very big, but it is safe and green. There are good schools and parks, though the public transport could be better.", tips: ["Согласись/не согласись", "Добавь плюс и минус"] },
    { p: "Part 2", q: "Describe a place you love visiting.", sample: "I would like to talk about a small park near my house. I go there almost every week, usually on Sunday morning. I walk along the river and read a book on a bench. I love it because it is quiet and makes me feel calm.", tips: ["Структура: где → как часто → что делаешь → почему", "Говори 1.5–2 минуты"] },
    { p: "Part 2", q: "Describe a person who has influenced you.", sample: "The person who influenced me most is my grandmother. She taught me to be patient and never give up. When I was a child, we spent a lot of time together and she told me stories about her life. Her example still guides my decisions.", tips: ["Кто → как знакомы → что сделал → почему важно", "Используй was / taught (прошлое)"] },
    { p: "Part 2", q: "Describe an important skill you have learned.", sample: "An important skill I have learned is cooking. I started learning it two years ago when I moved to another city. At first I burnt everything, but now I can cook several dishes well. It is important because it saves money and keeps me healthy.", tips: ["Что за навык → когда → как → почему важно", "Покажи прогресс: at first … now …"] },
    { p: "Part 2", q: "Describe a memorable journey.", sample: "A journey I remember well was a trip to the mountains last summer. I went with two friends and we travelled by train. We hiked for three days and saw amazing views. It was memorable because we laughed a lot and felt really free.", tips: ["Где → с кем → что было → почему запомнилось", "Добавь чувства и детали"] },
    { p: "Part 2", q: "Describe a useful piece of technology.", sample: "A useful device I own is my laptop. I use it every day for studying, writing and keeping in touch with friends. I have had it for about three years. It is useful because it allows me to work from anywhere.", tips: ["Что → как используешь → как долго → почему полезно", "Связки: because, so, for example"] },
    { p: "Part 2", q: "Describe a festival you enjoy.", sample: "One festival I really enjoy is New Year. It happens on the thirty-first of December, and I always celebrate it with my family. We cook a big dinner, exchange presents and watch the fireworks. I enjoy it because it feels warm and hopeful.", tips: ["Что → когда → с кем → почему нравится", "Укажи дату и детали"] },
    { p: "Part 3", q: "Why do people like travelling?", sample: "I think people travel for several reasons. First, it gives them a break from routine. Second, it lets them experience new cultures and food. Finally, travel often creates memories that people value for a lifetime.", tips: ["Дай 2–3 причины", "Связки: First, Second, Finally"] },
    { p: "Part 3", q: "Should schools teach practical skills?", sample: "Yes, I believe schools should teach practical skills such as managing money or cooking. These are useful in everyday life, and many students do not learn them at home. However, academic subjects should not be forgotten either.", tips: ["Позиция + аргумент", "Добавь оговорку: however"] },
    { p: "Part 3", q: "How has technology changed communication?", sample: "Technology has changed communication a lot. We can now reach anyone instantly through messaging apps and video calls. On the one hand, this connects people; on the other hand, some argue it makes face-to-face contact less common.", tips: ["On the one hand / on the other hand", "Назови эффект и его минус"] },
    { p: "Part 3", q: "Is it better to live in a city or the countryside?", sample: "It depends on the person. Cities offer more jobs and entertainment, while the countryside is quieter and healthier. Personally, I would choose a city while I am young, but I might prefer the countryside when I am older.", tips: ["It depends — хороший ход", "Сравни два варианта"] },
    { p: "Part 3", q: "Why do some people learn languages faster?", sample: "Some people learn languages faster for a few reasons. They practise every day, they are not afraid of making mistakes, and they often use the language in real situations. Motivation, I believe, matters more than natural talent.", tips: ["Перечисли факторы", "Заверши личным мнением"] },
    { p: "Part 3", q: "Should governments limit the use of cars in cities?", sample: "To some extent, yes. Limiting cars would reduce pollution and traffic, and it would encourage people to walk or cycle. Nevertheless, the government must provide good public transport first, otherwise people simply cannot travel.", tips: ["To some extent — мягкая позиция", "Добавь условие"] }
  ];

  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ic(n) { return w.Lexy.ic(n); }
  var cur = null;

  function check(text, sampleWords) {
    var issues = [];
    var t = String(text || "");
    if (!t.trim()) return { wc: 0, issues: ["Напиши ответ, чтобы получить разбор."] };
    var wc = t.trim().split(/\s+/).length;
    if (/\bi\b/.test(t)) issues.push("«i» всегда пишется с большой буквы — I.");
    if (/\b(dont|doesnt|cant|wont|isnt|didnt)\b/i.test(t)) issues.push("Нужен апостроф: don't, doesn't, can't, isn't.");
    if (/[a-zа-я]\.[A-ZА-Я]/.test(t)) issues.push("После точки — пробел и заглавная буква.");
    if (!/[.!?]$/.test(t.trim())) issues.push("Закончи предложение точкой.");
    if (/  +/.test(t)) issues.push("Убери лишние пробелы.");
    if (t[0] && t[0] === t[0].toLowerCase() && /[a-z]/i.test(t[0])) issues.push("Начни с заглавной буквы.");
    if (wc < 25) issues.push("Маловато для ответа — добавь 1–2 предложения (сейчас " + wc + " слов).");
    else if (wc >= 25 && wc <= sampleWords + 40) issues.push("Хороший объём (" + wc + " слов).");
    if (!issues.length) issues.push("Отличная структура. Проверь связки и грамматику времён.");
    return { wc: wc, issues: issues };
  }

  function pick() { cur = Q[Math.floor(Math.random() * Q.length)]; return cur; }

  function render(el) {
    if (!el) return;
    if (!w.Lexy.user.premium) { el.innerHTML = '<div class="card" style="text-align:center"><div style="font-size:40px">🔒</div><h2 style="font:800 22px var(--display);margin:10px 0">Lexy AI — Premium</h2><p class="s">Разговорная практика с вопросами, образцами и разбором — на тарифах Pro и Pro+.</p><a class="btn p" href="pricing.html" style="margin-top:14px">Получить Premium</a></div>'; return; }
    if (!cur) pick();
    var sampleWords = cur.sample.split(/\s+/).length;
    el.innerHTML = '<h1 class="t">Lexy AI</h1><p class="s">Практика Speaking: ответь на вопрос, затем сверься с образцом и разбором</p>' +
      '<div class="block" style="margin-top:16px"><div class="bhead"><span class="bic">' + ic("mic") + '</span><div><div class="btitle">' + esc(cur.p) + '</div><div class="bsub">Вопрос для практики</div></div></div>' +
      '<div class="qtext" style="font-size:20px">' + esc(cur.q) + '</div>' +
      '<div class="row" style="margin-top:8px"><button class="btn ghost sm" id="ailisten">🔊 Прослушать вопрос</button><button class="btn ghost sm" id="ainew">Новый вопрос</button></div>' +
      '<textarea id="aians" placeholder="Напиши свой ответ сюда (2–4 предложения)…" style="margin-top:14px"></textarea>' +
      '<button class="btn p" id="aicheck" style="margin-top:12px;width:100%">Проверить ответ</button>' +
      '<div id="aifb" style="margin-top:14px"></div>' +
      '<div class="tip" style="margin-top:14px"><b>Советы:</b> ' + cur.tips.map(esc).join(" · ") + '</div>' +
      '<div class="readpg" id="aisample" hidden style="margin-top:12px"><b>Образец ответа:</b><br>' + esc(cur.sample) + "</div>" +
      '<button class="btn ghost" id="aisampleb" style="margin-top:10px;width:100%">Показать образец ответа</button></div>';

    $("#ailisten", el).addEventListener("click", function () { speak(cur.q + ". " + cur.sample); });
    $("#ainew", el).addEventListener("click", function () { pick(); render(el); });
    $("#aisampleb", el).addEventListener("click", function () { var s = $("#aisample", el); s.hidden = !s.hidden; });
    $("#aicheck", el).addEventListener("click", function () {
      var r = check($("#aians", el).value, sampleWords);
      $("#aifb", el).innerHTML = '<div class="card"><b style="font:800 16px var(--display)">Разбор ответа</b><div style="margin-top:8px;font-size:14px;color:var(--soft)">Слов: <b style="color:var(--ink)">' + r.wc + "</b></div><ul style=\"margin:8px 0 0 18px;color:var(--soft);font-size:14px\">" + r.issues.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>";
    });
  }

  function speak(text) {
    if (!("speechSynthesis" in w)) { w.Lexy.toast("Озвучка не поддерживается"); return; }
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text); u.lang = "en-GB"; u.rate = 0.95;
    var vs = speechSynthesis.getVoices() || []; var v = vs.filter(function (x) { return /en[-_](GB|US)/i.test(x.lang); })[0]; if (v) u.voice = v;
    speechSynthesis.speak(u);
  }

  w.LexyAI = { render: render, questions: Q.length };
})(window);
