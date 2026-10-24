/* ==========================================================
   lexy-theme.js — тёмная/светлая тема для всего сайта
   • Хранит выбор в localStorage('theme'), ставит data-theme на <html>
   • Любой элемент с [data-theme-toggle] переключает тему
   ========================================================== */
(function (w) {
  "use strict";
  var KEY = "theme";
  function get() { try { return w.localStorage.getItem(KEY) === "dark" ? "dark" : "light"; } catch (e) { return "light"; } }
  function apply(t) { try { w.document.documentElement.setAttribute("data-theme", t === "dark" ? "dark" : "light"); } catch (e) {} }
  function set(t) { try { w.localStorage.setItem(KEY, t === "dark" ? "dark" : "light"); } catch (e) {} apply(t); paint(); }
  function toggle() { var t = get() === "dark" ? "light" : "dark"; set(t); return t; }
  function paint() {
    var ico = get() === "dark" ? "☀️" : "🌙";
    try {
      w.document.querySelectorAll("[data-theme-toggle]").forEach(function (b) {
        var s = b.querySelector(".th-ic"); if (s) s.textContent = ico; else b.textContent = ico;
        b.setAttribute("aria-label", get() === "dark" ? "Светлая тема" : "Тёмная тема");
        b.setAttribute("title", get() === "dark" ? "Светлая тема" : "Тёмная тема");
      });
    } catch (e) {}
  }
  function init() {
    apply(get());
    w.document.addEventListener("click", function (e) {
      if (e.target.closest("[data-theme-toggle]")) { e.preventDefault(); toggle(); }
    });
    paint();
    if (w.document.readyState === "loading") w.document.addEventListener("DOMContentLoaded", paint);
  }
  w.LexyTheme = { init: init, set: set, toggle: toggle, get: get, paint: paint, applied: "🌙" };
  init();
})(window);
