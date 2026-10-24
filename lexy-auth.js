(function (w) {
  "use strict";

  var KEY = "lexy_db_v1", SES = "lexy_session";
  var LEG = "user_logged_in", LEGE = "user_email";
  var cfg = w.LEXY_SUPABASE || {};
  var client = null;
  var current = null;
  var authUser = null;
  var syncTimer = null;

  function read() {
    try { return JSON.parse(w.localStorage.getItem(KEY)) || {}; }
    catch (e) { return {}; }
  }
  function write(db) {
    try { w.localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
  }
  function norm(email) { return String(email || "").trim().toLowerCase(); }
  function validEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
  function iso(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  function defaults(email) {
    var exam = new Date();
    exam.setDate(exam.getDate() + 90);
    return {
      email: email, name: "", path: null, onboard: null, premium: false, plan: "free",
      planExpires: null, examDate: iso(exam), target: 7.5, lang: "ru", news: true,
      created: Date.now(), streak: [], mins: {}, lessons: {}, phrases: 0, words: [],
      decks: [], tests: {}, dismiss: {}, vsort: false
    };
  }
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
  function emit() {
    try { w.dispatchEvent(new w.CustomEvent("lexy:auth", { detail: current })); } catch (e) {}
  }
  function premiumOf(profile) {
    var plan = String(profile && profile.plan || "free");
    var until = profile && profile.plan_expires_at ? new Date(profile.plan_expires_at).getTime() : 0;
    return plan !== "free" && (!until || until > Date.now());
  }
  function cacheProfile(profile) {
    if (Array.isArray(profile)) profile = profile[0];
    if (!profile) return null;
    var email = norm(profile.email || (authUser && authUser.email));
    if (!email) return null;
    var db = read();
    var rec = db[email] || defaults(email);
    if (profile.name) rec.name = profile.name;
    if (profile.path) rec.path = profile.path;
    rec.plan = profile.plan || "free";
    rec.planExpires = profile.plan_expires_at || null;
    rec.premium = premiumOf(profile);
    if (profile.target != null) rec.target = Number(profile.target);
    if (profile.exam_date) rec.examDate = profile.exam_date;
    if (profile.lang) rec.lang = profile.lang;
    if (profile.survey) rec.survey = profile.survey;
    rec.email = email;
    rec.authId = profile.id || (authUser && authUser.id) || rec.authId;
    rec.supabase = true;
    rec.passHash = "supabase";
    rec.salt = "supabase";
    db[email] = rec;
    write(db);
    setSession(email);
    current = rec;
    emit();
    return rec;
  }
  function cacheBasic(user) {
    var email = norm(user && user.email);
    if (!email) return null;
    var db = read();
    var rec = db[email] || defaults(email);
    var meta = user.user_metadata || {};
    rec.email = email;
    if (!rec.name && (meta.name || meta.full_name)) rec.name = meta.name || meta.full_name;
    rec.plan = rec.plan || "free";
    rec.premium = rec.plan !== "free" && (!rec.planExpires || new Date(rec.planExpires).getTime() > Date.now());
    rec.authId = user.id;
    rec.supabase = true;
    rec.passHash = "supabase";
    rec.salt = "supabase";
    db[email] = rec;
    write(db);
    setSession(email);
    current = rec;
    emit();
    return rec;
  }
  function user() {
    var email = null;
    try { email = w.localStorage.getItem(SES); } catch (e) {}
    if (!email) return null;
    if (current && current.email === email) return current;
    var rec = read()[email];
    if (rec && rec.supabase) { current = rec; return rec; }
    return null;
  }
  function session() { var u = user(); return u ? u.email : null; }
  function logged() { return !!user(); }

  function loadSdk() {
    if (w.supabase && w.supabase.createClient) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var script = w.document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
      script.async = true;
      script.onload = function () { resolve(); };
      script.onerror = function () { reject(new Error("supabase_sdk_unavailable")); };
      w.document.head.appendChild(script);
    });
  }

  function mapAuthError(error) {
    var message = String(error && (error.message || error.error_description || error) || "").toLowerCase();
    if (message.indexOf("invalid login") > -1 || message.indexOf("invalid credentials") > -1) return { code: "pass" };
    if (message.indexOf("user not found") > -1 || message.indexOf("no user") > -1) return { code: "nouser" };
    if (message.indexOf("already registered") > -1 || message.indexOf("already exists") > -1) return { code: "exists" };
    if (message.indexOf("password") > -1) return { code: "pass" };
    if (message.indexOf("email") > -1 && message.indexOf("valid") > -1) return { code: "email" };
    if (message.indexOf("rate limit") > -1) return { code: "rate" };
    if (message.indexOf("provider is not enabled") > -1) return { code: "google" };
    return { code: "generic" };
  }
  function rejectAuth(error) {
    var mapped = error && error.code ? error : mapAuthError(error);
    return Promise.reject(mapped);
  }

  function loadProfile(userObj) {
    authUser = userObj;
    return client.rpc("lexy_my_profile").then(function (res) {
      if (res.error) throw res.error;
      return cacheProfile(res.data);
    }).catch(function () {
      return cacheBasic(userObj);
    });
  }

  function settleRedirect() {
    var hash = String(w.location.hash || "");
    if (hash.indexOf("access_token=") < 0 && hash.indexOf("error_description=") < 0) return Promise.resolve();
    return new Promise(function (resolve) { setTimeout(resolve, 400); });
  }

  function boot() {
    if (!cfg.url || !cfg.anonKey) return Promise.resolve(null);
    return loadSdk().then(function () {
      client = w.supabase.createClient(cfg.url, cfg.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: "implicit"
        }
      });
      client.auth.onAuthStateChange(function (event, authSession) {
        if (event === "SIGNED_OUT") {
          current = null;
          authUser = null;
          clearSession();
          emit();
        } else if (event === "SIGNED_IN" && authSession && authSession.user) {
          setTimeout(function () { loadProfile(authSession.user).catch(function () {}); }, 0);
        }
      });
      return settleRedirect();
    }).then(function () {
      return client.auth.getSession();
    }).then(function (res) {
      var authSession = res && res.data ? res.data.session : null;
      if (!authSession || !authSession.user) {
        current = null;
        authUser = null;
        clearSession();
        return null;
      }
      return loadProfile(authSession.user);
    }).then(function (profile) {
      try {
        if (w.location.hash && (w.location.hash.indexOf("access_token=") > -1 || w.location.hash.indexOf("error_description=") > -1)) {
          w.history.replaceState(null, "", w.location.pathname + w.location.search);
        }
      } catch (e) {}
      return profile;
    }).catch(function () {
      current = null;
      authUser = null;
      clearSession();
      return null;
    });
  }

  function accessToken() {
    if (!client) return Promise.resolve(null);
    return client.auth.getSession().then(function (res) {
      var authSession = res && res.data ? res.data.session : null;
      return authSession ? authSession.access_token : null;
    }).catch(function () { return null; });
  }

  function refresh() {
    if (!client) return Promise.resolve(null);
    return client.auth.getSession().then(function (res) {
      var authSession = res && res.data ? res.data.session : null;
      if (!authSession || !authSession.user) {
        current = null;
        authUser = null;
        clearSession();
        emit();
        return null;
      }
      return loadProfile(authSession.user);
    }).catch(function () { return null; });
  }

  function queueProfileSync(patch) {
    var body = {};
    if (Object.prototype.hasOwnProperty.call(patch, "name")) body.p_name = String(patch.name || "");
    if (Object.prototype.hasOwnProperty.call(patch, "path")) body.p_path = patch.path === "english" ? "english" : patch.path === "ielts" ? "ielts" : null;
    if (Object.prototype.hasOwnProperty.call(patch, "target")) body.p_target = patch.target != null ? Number(patch.target) : null;
    if (Object.prototype.hasOwnProperty.call(patch, "examDate")) body.p_exam_date = patch.examDate || null;
    if (Object.prototype.hasOwnProperty.call(patch, "lang")) body.p_lang = patch.lang || null;
    if (Object.prototype.hasOwnProperty.call(patch, "survey")) body.p_survey = patch.survey || null;
    if (Object.prototype.hasOwnProperty.call(patch, "settings")) body.p_settings = patch.settings || null;
    if (!Object.keys(body).length || !client) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(function () {
      client.rpc("lexy_update_profile", body).then(function (res) {
        if (!res.error && res.data) cacheProfile(res.data);
      }).catch(function () {});
    }, 350);
  }

  function update(patch) {
    var u = user();
    if (!u) return null;
    var db = read();
    var rec = db[u.email] || u;
    for (var k in patch) {
      if (Object.prototype.hasOwnProperty.call(patch, k)) rec[k] = patch[k];
    }
    if (Object.prototype.hasOwnProperty.call(patch, "premium")) {
      rec.plan = patch.premium ? (rec.plan === "free" ? "pro" : rec.plan) : "free";
      rec.planExpires = patch.premium ? rec.planExpires : null;
    }
    db[rec.email] = rec;
    write(db);
    current = rec;
    queueProfileSync(patch);
    return rec;
  }

  function register(options) {
    options = options || {};
    var email = norm(options.email);
    var name = String(options.name || "").trim();
    var password = String(options.password || "");
    if (!name) return Promise.reject({ code: "name" });
    if (!validEmail(email)) return Promise.reject({ code: "email" });
    if (password.length < 6) return Promise.reject({ code: "pass" });
    if (!client) return Promise.reject({ code: "generic" });

    return client.auth.signUp({
      email: email,
      password: password,
      options: { data: { name: name } }
    }).then(function (res) {
      if (res.error) throw res.error;
      if (res.data && res.data.user && Array.isArray(res.data.user.identities) && res.data.user.identities.length === 0) {
        throw { code: "exists" };
      }
      if (res.data && res.data.session) return res.data.session;
      return client.auth.signInWithPassword({ email: email, password: password }).then(function (login) {
        if (login.error) throw login.error;
        return login.data.session;
      });
    }).then(function (authSession) {
      if (!authSession || !authSession.user) throw { code: "generic" };
      authUser = authSession.user;
      var path = options.path === "english" ? "english" : "ielts";
      var target = typeof options.target === "number" && isFinite(options.target) ? options.target : 7.5;
      return client.rpc("lexy_update_profile", {
        p_name: name,
        p_path: path,
        p_target: target,
        p_exam_date: options.examDate || null,
        p_lang: options.lang || "ru",
        p_survey: options.survey || null
      }).then(function (res) {
        if (res.error) throw res.error;
        return cacheProfile(res.data);
      });
    }).catch(rejectAuth);
  }

  function login(email, password) {
    email = norm(email);
    password = String(password || "");
    if (!validEmail(email)) return Promise.reject({ code: "email" });
    if (!password) return Promise.reject({ code: "pass" });
    if (!client) return Promise.reject({ code: "generic" });
    return client.auth.signInWithPassword({ email: email, password: password }).then(function (res) {
      if (res.error) throw res.error;
      if (!res.data || !res.data.user) throw { code: "generic" };
      return loadProfile(res.data.user);
    }).catch(rejectAuth);
  }

  function sendMagicLink(email) {
    email = norm(email);
    if (!validEmail(email)) return Promise.reject({ code: "email" });
    if (!client) return Promise.reject({ code: "generic" });
    return client.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: (cfg.siteUrl || w.location.origin + "/") + "login.html"
      }
    }).then(function (res) {
      if (res.error) throw res.error;
      return true;
    }).catch(rejectAuth);
  }

  function signInWithGoogle(redirect) {
    if (!client) return Promise.reject({ code: "generic" });
    var target = redirect || (w.location.pathname.indexOf("reg.html") > -1 ? "reg.html" : "login.html");
    return client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: (cfg.siteUrl || w.location.origin + "/") + target }
    }).then(function (res) {
      if (res.error) throw res.error;
      return true;
    }).catch(rejectAuth);
  }

  function logout() {
    var done = client ? client.auth.signOut().catch(function () {}) : Promise.resolve();
    current = null;
    authUser = null;
    clearSession();
    emit();
    return done;
  }

  function deleteAccount() {
    if (!client) return Promise.reject({ code: "generic" });
    var email = session();
    return client.rpc("lexy_delete_account").then(function (res) {
      if (res.error) throw res.error;
      if (email) {
        var db = read();
        delete db[email];
        write(db);
      }
      return client.auth.signOut().catch(function () {});
    }).then(function () {
      current = null;
      authUser = null;
      clearSession();
      emit();
      return true;
    }).catch(rejectAuth);
  }

  var ready = boot();

  w.LexyAuth = {
    key: KEY,
    ready: ready,
    normalize: norm,
    validEmail: validEmail,
    session: session,
    user: user,
    profile: function () { return current; },
    logged: logged,
    register: register,
    login: login,
    sendMagicLink: sendMagicLink,
    signInWithGoogle: signInWithGoogle,
    logout: logout,
    deleteAccount: deleteAccount,
    refresh: refresh,
    update: update,
    token: accessToken,
    client: function () { return client; }
  };
})(window);
