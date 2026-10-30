import {
  authUser,
  json,
  PLAN_NAMES,
  PLAN_PRICES,
  platega,
  preflight,
  readJson,
  rest,
  siteUrl,
} from "../_shared/platega.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const user = await authUser(req);
  if (!user) return json({ error: "unauthorized" }, 401);

  const body = await readJson(req);
  const plan = String(body.plan || "");
  if (!Object.prototype.hasOwnProperty.call(PLAN_PRICES, plan)) {
    return json({ error: "bad_plan" }, 400);
  }

  const amount = PLAN_PRICES[plan];
  const paymentId = crypto.randomUUID();
  const site = siteUrl();

  try {
    await rest("payments", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify([{
        id: paymentId,
        user_id: user.id,
        provider: "platega",
        plan,
        amount,
        currency: "RUB",
        status: "pending",
        raw: {},
      }]),
    });
  } catch (error) {
    console.error("payment insert failed", (error as any).status);
    return json({ error: "database" }, 500);
  }

  let created: any;
  try {
    created = await platega("/v2/transaction/process", {
      method: "POST",
      body: JSON.stringify({
        paymentDetails: { amount, currency: "RUB" },
        description: `Lexy ${PLAN_NAMES[plan]} — 30 дней`,
        return: `${site}/dashboard.html?payment=success&local=${paymentId}`,
        failedUrl: `${site}/pricing.html?payment=failed`,
        payload: paymentId,
      }),
    });
  } catch (error) {
    const status = (error as any).status || 502;
    const details = (error as any).data || {};
    console.error("platega create failed", status, details?.message || details?.error || "");
    try {
      await rest(`payments?id=eq.${paymentId}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "failed",
          raw: { error: details?.message || details?.error || "provider_error", httpStatus: status },
        }),
      });
    } catch {}
    return json({ error: "provider", message: "Не удалось создать платёж. Попробуй ещё раз." }, 502);
  }

  const transactionId = created?.transactionId || created?.id || "";
  const redirect = created?.redirect || created?.url || created?.payformSuccessUrl || "";
  if (!transactionId || !redirect) {
    try {
      await rest(`payments?id=eq.${paymentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "failed", raw: { error: "invalid_provider_response" } }),
      });
    } catch {}
    return json({ error: "provider", message: "Платёжный сервис вернул неполный ответ." }, 502);
  }

  try {
    await rest(`payments?id=eq.${paymentId}`, {
      method: "PATCH",
      body: JSON.stringify({
        provider_transaction_id: transactionId,
        payment_url: redirect,
        raw: created,
      }),
    });
  } catch (error) {
    console.error("payment update failed", (error as any).status);
    return json({ error: "database" }, 500);
  }

  return json({
    ok: true,
    paymentId,
    transactionId,
    redirect,
    plan,
    amount,
    currency: "RUB",
    status: created?.status || "PENDING",
    expiresIn: created?.expiresIn || null,
  });
});

