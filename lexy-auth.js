/* ==========================================================
   lexy-auth.js — общая авторизация статического сайта Lexy
   Аккаунты и сессия хранятся в localStorage. Пароль не пишется
   в открытом виде: хранится соль + SHA-256 (или резервный хеш).
   ========================================================== */
(function (w) {
  "use strict";

  var KEY = "lexy_db_v1", SES = "lexy_session";
  var LEG = "user_logged_in", LEGE = "user_email";

  function read() {
    try { return JSON.parse(w.localStorage.getItem(KEY)) || {}; }
    catch (e) { return {}; }
  }
  function write(db) {
    try { w.localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
  }
  function norm(email) { return String(email || "").trim().toLowerCase(); }
  function validEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

  function session() {
    try { return w.localStorage.getItem(SES); } catch (e) { return null; }
  }
  function user() {
    var email = session();
    if (!email) return null;
    var u = read()[email] || null;
    return (u && u.passHash && u.salt) ? u : null;
  }
  function logged() { return !!user(); }

  function setSession(email) {
    try {
      w.localStorage.setItem(SES, email);
      w.localStorage.setItem(LEG, "true");
      w.localStorage.setItem(LEGE, email);
    } catch (e) {}
  }
  function clearSession() {
    try {
      w.localStorage.removeItem(SES);
      w.localStorage.removeItem(LEG);
      w.localStorage.removeItem(LEGE);
    } catch (e) {}
  }

  function randomSalt() {
    var a = new Uint8Array(16), i;
    if (w.crypto && w.crypto.getRandomValues) w.crypto.getRandomValues(a);
    else for (i = 0; i < 16; i++) a[i] = Math.floor(Math.random() * 256);
    return Array.prototype.map.call(a, function (x) {
      return ("0" + x.toString(16)).slice(-2);
    }).join("");
  }

  function fallbackHash(str) {
    var h1 = 0x811c9dc5, h2 = 0x9e3779b9, i, c;
    for (i = 0; i < str.length; i++) {
      c = str.charCodeAt(i);
      h1 ^= c; h1 = (h1 * 0x01000193) >>> 0;
      h2 ^= c; h2 = (h2 * 0x85ebca6b) >>> 0;
    }
    return ("00000000" + h1.toString(16)).slice(-8) + ("00000000" + h2.toString(16)).slice(-8);
  }

  function hash(pass, salt) {
    var str = salt + ":" + pass;
    if (w.crypto && w.crypto.subtle && w.TextEncoder) {
      try {
        var data = new w.TextEncoder().encode(str);
        return w.crypto.subtle.digest("SHA-256", data).then(function (buf) {
          var out = [], v = new Uint8Array(buf), i;
          for (i = 0; i < v.length; i++) out.push(("0" + v[i].toString(16)).slice(-2));
          return out.join("");
        }).catch(function () { return "fb:" + fallbackHash(str); });
      } catch (e) {}
    }
    return Promise.resolve("fb:" + fallbackHash(str));
  }

  function iso(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }

  function defaults(email) {
    var exam = new Date();
    exam.setDate(exam.getDate() + 90);
    return {
      email: email, name: "", path: null, onboard: null, premium: false,
      examDate: iso(exam), target: 7.5, lang: "ru", news: true, created: Date.now(),
      streak: [], mins: {}, lessons: {}, phrases: 0, words: [], decks: [],
      tests: {}, dismiss: {}, vsort: false
    };
  }

  function register(o) {
    o = o || {};
    var email = norm(o.email);
    var name = String(o.name || "").trim();
    var pass = String(o.password || "");
    if (!name) return Promise.reject({ code: "name" });
    if (!validEmail(email)) return Promise.reject({ code: "email" });
    if (pass.length < 6) return Promise.reject({ code: "pass" });
    var db = read();
    var existing = db[email];
    if (existing && (existing.passHash || existing.salt)) return Promise.reject({ code: "exists" });

    var salt = randomSalt();
    return hash(pass, salt).then(function (h) {
      var u = existing || defaults(email);
      var base = defaults(email);
      for (var k in base) {
        if (Object.prototype.hasOwnProperty.call(base, k) && u[k] === undefined) u[k] = base[k];
      }
      u.name = name;
      u.salt = salt;
      u.passHash = h;
      u.path = o.path === "english" ? "english" : "ielts";
      u.target = (typeof o.target === "number" && isFinite(o.target)) ? o.target : 7.5;
      if (o.examDate) u.examDate = o.examDate;
      if (o.survey) u.survey = o.survey;
      if (o.onboard) u.onboard = o.onboard;
      if (o.lang) u.lang = o.lang;
      db[email] = u;
      write(db);
      setSession(email);
      return u;
    });
  }

  function login(email, pass) {
    email = norm(email);
    pass = String(pass || "");
    if (!validEmail(email)) return Promise.reject({ code: "email" });
    var db = read(), u = db[email];
    if (!u) return Promise.reject({ code: "nouser" });
    if (!u.passHash || !u.salt) return Promise.reject({ code: "legacy" });
    return hash(pass, u.salt).then(function (h) {
      if (h !== u.passHash) return Promise.reject({ code: "pass" });
      setSession(email);
      return u;
    });
  }

  function update(patch) {
    var u = user();
    if (!u) return null;
    var db = read();
    var rec = db[u.email] || u;
    for (var k in patch) {
      if (Object.prototype.hasOwnProperty.call(patch, k)) rec[k] = patch[k];
    }
    db[rec.email] = rec;
    write(db);
    return rec;
  }

  w.LexyAuth = {
    key: KEY,
    normalize: norm,
    validEmail: validEmail,
    session: session,
    user: user,
    logged: logged,
    register: register,
    login: login,
    logout: clearSession,
    update: update
  };
})(window);
