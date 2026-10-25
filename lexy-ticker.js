/* ==========================================================
   lexy-ticker.js — бегущая строка «Типичные ошибки → исправление»
   (порт MistakeTicker из GoLexi). Реальные пары из lib/grammar.ts.
   ========================================================== */
(function (w, d) {
  "use strict";
  if (d.getElementById("mx-ticker")) return;

  var PAIRS = [
    ["I am agree with this idea.", "I agree with this idea."],
    ["I have lived here since five years.", "I have lived here for five years."],
    ["We made a lot of photos.", "We took a lot of photos."],
    ["My brother don't like coffee.", "My brother doesn't like coffee."],
    ["People is worried about prices.", "People are worried about prices."],
    ["Can you explain me this rule?", "Can you explain this rule to me?"],
    ["It depends of the weather.", "It depends on the weather."],
    ["She gave me an advice.", "She gave me a piece of advice."],
    ["If it will rain, we will stay home.", "If it rains, we will stay home."],
    ["Public transport is more better than cars.", "Public transport is better than cars."],
    ["I didn't went to school yesterday.", "I didn't go to school yesterday."],
    ["I enjoy to read books.", "I enjoy reading books."],
    ["On my opinion, this is wrong.", "In my opinion, this is wrong."],
    ["I am interested on history.", "I am interested in history."]
  ];
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function css() {
    if (d.getElementById("mx-css")) return;
    var s = d.createElement("style"); s.id = "mx-css";
    s.textContent =
      ".mxt{overflow:hidden;padding:26px 0;background:transparent}" +
      ".mxt-track{display:flex;gap:14px;width:max-content;list-style:none;margin:0;padding:0;animation:mxt-move 46s linear infinite}" +
      ".mxt:hover .mxt-track{animation-play-state:paused}" +
      "@keyframes mxt-move{from{transform:translateX(0)}to{transform:translateX(-50%)}}" +
      ".mxt-track li{flex:none;display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid var(--line);border-radius:999px;padding:11px 18px;font:500 15px var(--body);box-shadow:0 12px 30px -22px rgba(27,20,51,.5);white-space:nowrap}" +
      ".mxt-track s{color:var(--soft);text-decoration-color:rgba(229,72,77,.7);text-decoration-thickness:2px}" +
      ".mxt-track .ar{color:var(--fire);font-weight:800}" +
      ".mxt-track b{font-weight:700}" +
      "@media(prefers-reduced-motion:reduce){.mxt-track{animation:none}}" +
      "[data-theme='dark'] .mxt-track li{background:#1C1633;border-color:#332A52;color:#EDE9F7}" +
      "[data-theme='dark'] .mxt-track s{color:#9A93B8}";
    d.head.appendChild(s);
  }
  function inject() {
    if (d.getElementById("mx-ticker")) return;
    var hero = d.querySelector(".hero");
    if (!hero) return;
    css();
    var row = PAIRS.map(function (p) { return '<li><s>' + esc(p[0]) + '</s><span class="ar">→</span><b>' + esc(p[1]) + "</b></li>"; }).join("");
    var sec = d.createElement("section");
    sec.className = "mxt"; sec.id = "mx-ticker";
    sec.setAttribute("aria-label", "Типичные ошибки и их исправления");
    sec.innerHTML = '<ul class="mxt-track">' + row + row + "</ul>";
    hero.parentNode.insertBefore(sec, hero.nextSibling);
  }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", inject); else inject();
})(window, document);
