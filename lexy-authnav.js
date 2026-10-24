/* ==========================================================
   lexy-authnav.js — правки шапки/ссылок на публичных страницах
   • Если пользователь вошёл в аккаунт:
     – логотип «Lexi» ведёт в его кабинет (выбранный путь)
     – «Главное меню» ведёт в кабинет и подписывается «Назад»
     – кнопки регистрации/входа скрываются
   • Работает офлайн (только localStorage), без загрузки SDK.
   ========================================================== */
(function (w) {
  "use strict";
  try {
    var email = w.localStorage.getItem("lexy_session");
    if (!email) return;
    var db = {};
    try { db = JSON.parse(w.localStorage.getItem("lexy_db_v1")) || {}; } catch (e) {}
    var rec = db[email] || db[String(email).toLowerCase()] || {};
    var dest = rec.path === "ielts" ? "dashboard-ielts.html" : "dashboard-english.html";
    var langs = { ru: "Назад", en: "Back", kz: "Артқа", uz: "Orqaga" };
    var back = langs[rec.lang] || langs.ru;
    function run() {
      var d = w.document;
      d.querySelectorAll("a.logo").forEach(function (a) { a.setAttribute("href", dest); });
      d.querySelectorAll(".menu-btn, a.back").forEach(function (a) {
        a.setAttribute("href", dest);
        var s = a.querySelector("span");
        if (s) s.textContent = back; else a.textContent = "← " + back;
      });
      d.querySelectorAll('a[href="reg.html"]').forEach(function (a) { a.style.display = "none"; });
      d.querySelectorAll('a[href="login.html"]').forEach(function (a) {
        if (a.hasAttribute("data-auth-login")) return;
        a.style.display = "none";
      });
      d.body.setAttribute("data-nav-auth", "in");
    }
    if (w.document.readyState !== "loading") run();
    else w.document.addEventListener("DOMContentLoaded", run);
  } catch (e) {}
})(window);
