import {
  corsHeaders,
  json,
  platega,
  preflight,
  rest,
} from "../_shared/platega.ts";

const CRON_SECRET = Deno.env.get("LEXY_CRON_SECRET") || "";

function authorized(req: Request): boolean {
  if (!CRON_SECRET) return true;
  const header = req.headers.get("x-cron-secret") || "";
  return header === CRON_SECRET;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (!authorized(req)) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let pending: any[] = [];
  try {
    pending = await rest(
      "payments?status=eq.pending&provider_transaction_id=not.is.null" +
        "&created_at=gte." + new Date(Date.now() - 24 * 3600 * 1000).toISOString() +
        "&select=*&order=created_at.asc&limit=100",
    );
  } catch (error) {
    console.error("reconcile query failed", (error as any).status);
    return json({ error: "database" }, 500);
  }

  const summary = { checked: 0, confirmed: 0, failed: 0, pending: 0, errors: 0 };

  for (const payment of pending || []) {
    summary.checked++;
    let statusPayload: any;
    try {
      statusPayload = await platega(
        `/transaction/${encodeURIComponent(payment.provider_transaction_id)}`,
      );
    } catch (error) {
      summary.errors++;
      continue;
    }

    const status = String(statusPayload?.status || "").toUpperCase();
    const providerAmount = Number(statusPayload?.paymentDetails?.amount ?? payment.amount);
    const providerCurrency = String(
      statusPayload?.paymentDetails?.currency || payment.currency,
    ).toUpperCase();

    try {
      if (status === "CONFIRMED") {
        await rest("rpc/lexy_confirm_payment", {
          method: "POST",
          body: JSON.stringify({
            p_transaction_id: payment.provider_transaction_id,
            p_amount: providerAmount,
            p_currency: providerCurrency,
            p_raw: statusPayload,
          }),
        });
        summary.confirmed++;
      } else if (["CANCELED", "CHARGEBACKED", "EXPIRED", "FAILED"].includes(status)) {
        const mapped = status === "CANCELED"
          ? "canceled"
          : status === "CHARGEBACKED"
          ? "chargebacked"
          : "failed";
        await rest("rpc/lexy_fail_payment", {
          method: "POST",
          body: JSON.stringify({
            p_transaction_id: payment.provider_transaction_id,
            p_status: mapped,
            p_raw: statusPayload,
          }),
        });
        summary.failed++;
      } else {
        summary.pending++;
      }
    } catch (error) {
      summary.errors++;
      console.error("reconcile update failed", (error as any).status, (error as any).data);
    }
  }

  return json({ ok: true, summary });
});
