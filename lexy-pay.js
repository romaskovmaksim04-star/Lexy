/* ==========================================================
   lexy-pay.js — оплата через Platega (Supabase Edge Functions)
   • LexyPay.create(plan)   → создаёт платёж, возвращает ссылку
   • LexyPay.status(opts)   → сверяет статус платежа с провайдером
   • LexyPay.handleReturn() → обрабатывает возврат с оплаты
   ========================================================== */
(function (w) {
  "use strict";

  var cfg = w.LEXY_SUPABASE || {};
  var base = String(cfg.url || "").replace(/\/+$/, "");

  function ready() {
    if (w.LexyAuth && w.LexyAuth.ready && w.LexyAuth.ready.then) return w.LexyAuth.ready;
    return Promise.resolve();
  }

  function authToken() {
    if (!w.LexyAuth || !w.LexyAuth.token) return Promise.resolve(null);
    return w.LexyAuth.token();
  }

  function call(name, body) {
    if (!base) return Promise.reject({ code: "config" });
    return authToken().then(function (token) {
      if (!token) throw { code: "auth" };
      return fetch(base + "/functions/v1/" + name, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
          "apikey": cfg.anonKey || ""
        },
        body: JSON.stringify(body || {})
      }).then(function (res) {
        return res.text().then(function (text) {
          var data = null;
          try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
          if (!res.ok) {
            throw {
              code: (data && data.error) || "http",
              status: res.status,
              message: (data && data.message) || ""
            };
          }
          return data;
        });
      });
    });
  }

  function create(plan) {
    return call("platega-create", { plan: plan });
  }

  function status(opts) {
    return call("platega-status", opts || {});
  }

  function readParams() {
    try { return new URLSearchParams(w.location.search || ""); }
    catch (e) { return new URLSearchParams(); }
  }

  function cleanUrl() {
    try {
      var url = w.location.pathname + w.location.hash;
      w.history.replaceState(null, "", url);
    } catch (e) {}
  }

  function toast(msg) {
    try {
      if (w.Lexy && w.Lexy.toast) { w.Lexy.toast(msg); return; }
    } catch (e) {}
    try { console.log("[LexyPay]", msg); } catch (e) {}
  }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function confirmPayment(paymentId, attempts) {
    return status({ paymentId: paymentId }).then(function (res) {
      var st = res && res.status ? res.status : "pending";
      if (st === "confirmed") return "confirmed";
      if (st === "canceled" || st === "chargebacked" || st === "failed") return st;
      if (attempts <= 1) return "pending";
      return wait(2000).then(function () { return confirmPayment(paymentId, attempts - 1); });
    }).catch(function () { return "pending"; });
  }

  function handleReturn() {
    var params = readParams();
    var payment = params.get("payment");
    if (!payment) return Promise.resolve(false);

    return ready().then(function () {
      if (!w.LexyAuth || !w.LexyAuth.logged()) {
        cleanUrl();
        return false;
      }
      if (payment === "failed") {
        toast("Оплата не завершена — остаёшься на бесплатном плане");
        cleanUrl();
        return false;
      }
      if (payment !== "success") { cleanUrl(); return false; }

      var paymentId = params.get("local") || params.get("paymentId") || "";
      toast("Проверяем оплату…");
      return confirmPayment(paymentId, 6).then(function (result) {
        if (result === "confirmed") {
          toast("Оплата прошла — Premium активирован 🎉");
        } else if (result === "pending") {
          toast("Оплата обрабатывается — обнови страницу через минуту");
        } else {
          toast("Оплата не подтверждена — остаёшься на бесплатном плане");
        }
        return (w.LexyAuth.refresh ? w.LexyAuth.refresh() : Promise.resolve()).then(function () {
          cleanUrl();
          if (result === "confirmed") {
            setTimeout(function () { w.location.reload(); }, 1200);
          }
          return true;
        });
      });
    });
  }

  w.LexyPay = {
    create: create,
    status: status,
    handleReturn: handleReturn
  };
})(window);
