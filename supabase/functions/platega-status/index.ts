import {
  authUser,
  json,
  platega,
  preflight,
  readJson,
  rest,
} from "../_shared/platega.ts";

function paymentView(payment: any) {
  return {
    paymentId: payment.id,
    transactionId: payment.provider_transaction_id,
    plan: payment.plan,
    amount: Number(payment.amount),
    currency: payment.currency,
    status: payment.status,
    createdAt: payment.created_at,
    paidAt: payment.paid_at,
  };
}

function profileView(profile: any) {
  if (!profile) return null;
  return {
    plan: profile.plan,
    planExpiresAt: profile.plan_expires_at,
    premium: profile.plan !== "free" &&
      (!profile.plan_expires_at || new Date(profile.plan_expires_at).getTime() > Date.now()),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST" && req.method !== "GET") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const user = await authUser(req);
  if (!user) return json({ error: "unauthorized" }, 401);

  const body = req.method === "POST" ? await readJson(req) : {};
  const transactionId = String(body.transactionId || "").trim();
  const paymentId = String(body.paymentId || "").trim();

  let rows: any[] = [];
  try {
    rows = await rest(
      `payments?user_id=eq.${encodeURIComponent(user.id)}&select=*&order=created_at.desc&limit=8`,
    );
  } catch {
    return json({ error: "database" }, 500);
  }

  let targets = rows;
  if (transactionId) {
    targets = rows.filter((row) => row.provider_transaction_id === transactionId);
  } else if (paymentId) {
    targets = rows.filter((row) => row.id === paymentId);
  }
  if (!targets.length) return json({ ok: true, status: "none" });

  let primary: any = null;
  let profile: any = null;
  let lastError = "";

  for (const payment of targets.slice(0, 5)) {
    if (!payment.provider_transaction_id) {
      if (!primary) primary = paymentView(payment);
      continue;
    }
    if (payment.status === "confirmed") {
      if (!primary) primary = paymentView(payment);
      continue;
    }
    if (payment.status === "canceled" || payment.status === "chargebacked") {
      if (!primary) primary = paymentView(payment);
      continue;
    }

    let statusPayload: any;
    try {
      statusPayload = await platega(`/transaction/${encodeURIComponent(payment.provider_transaction_id)}`);
    } catch (error) {
      lastError = `provider_${(error as any).status || "error"}`;
      if (!primary) primary = paymentView(payment);
      continue;
    }

    const status = String(statusPayload?.status || "").toUpperCase();
    const providerAmount = Number(statusPayload?.paymentDetails?.amount ?? payment.amount);
    const providerCurrency = String(statusPayload?.paymentDetails?.currency || payment.currency).toUpperCase();

    if (status === "CONFIRMED") {
      try {
        const result = await rest("rpc/lexy_confirm_payment", {
          method: "POST",
          body: JSON.stringify({
            p_transaction_id: payment.provider_transaction_id,
            p_amount: providerAmount,
            p_currency: providerCurrency,
            p_raw: statusPayload,
          }),
        });
        profile = result?.profile || null;
        primary = paymentView(result?.payment || payment);
        primary.status = "confirmed";
      } catch (error) {
        lastError = "confirm_failed";
        console.error("confirm failed", (error as any).status, (error as any).data);
        primary = paymentView(payment);
      }
    } else if (["CANCELED", "CHARGEBACKED", "EXPIRED", "FAILED"].includes(status)) {
      const mapped = status === "CANCELED" ? "canceled" : status === "CHARGEBACKED" ? "chargebacked" : "failed";
      try {
        const result = await rest("rpc/lexy_fail_payment", {
          method: "POST",
          body: JSON.stringify({
            p_transaction_id: payment.provider_transaction_id,
            p_status: mapped,
            p_raw: statusPayload,
          }),
        });
        if (!primary) {
          primary = paymentView(result || payment);
          primary.status = mapped;
        }
      } catch (error) {
        lastError = "status_failed";
        if (!primary) primary = paymentView(payment);
      }
    } else {
      if (!primary) primary = paymentView(payment);
      primary.status = "pending";
    }
  }

  if (!profile) {
    try {
      const profiles = await rest(
        `profiles?id=eq.${encodeURIComponent(user.id)}&select=plan,plan_expires_at&limit=1`,
      );
      profile = profiles?.[0] || null;
    } catch {}
  }

  return json({
    ok: true,
    payment: primary,
    profile: profileView(profile),
    status: primary?.status || "pending",
    error: lastError || undefined,
  });
});
