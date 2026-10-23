import "server-only";

// Platega payments, the same merchant and API shape Ghostly uses: create a transaction,
// send the user to its page, then poll its status (Platega has no webhook here).

const BASE = (process.env.PLATEGA_BASE_URL ?? "https://app.platega.io").replace(/\/+$/, "");

export const PAID = new Set(["CONFIRMED", "SUCCESS", "PAID"]);
export const FAILED = new Set(["CANCELED", "CANCELLED", "FAILED", "CHARGEBACKED", "EXPIRED"]);

export function paymentsEnabled(): boolean {
  return !!(process.env.PLATEGA_MERCHANT_ID && process.env.PLATEGA_SECRET);
}

function headers() {
  return {
    "X-MerchantId": String(process.env.PLATEGA_MERCHANT_ID).trim(),
    "X-Secret": String(process.env.PLATEGA_SECRET).trim(),
    "Content-Type": "application/json",
  };
}

export async function createTransaction(input: { orderId: string; amount: number; description: string; userId: string; site: string; ip?: string }): Promise<{ tx: string; url: string }> {
  const res = await fetch(`${BASE}/v2/transaction/process`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      paymentDetails: { amount: Math.round(input.amount), currency: "RUB" },
      description: input.description,
      return: `${input.site}/pay/return?o=${input.orderId}`,
      failedUrl: `${input.site}/pay/return?o=${input.orderId}&f=1`,
      payload: `lexy:${input.orderId}:${input.userId}`,
      metadata: { userId: input.userId, userName: input.userId, clientIp: input.ip ?? "" },
    }),
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`platega create ${res.status}`);
  const data = (await res.json()) as { transactionId?: string; url?: string; redirect?: string };
  const url = data.url ?? data.redirect;
  if (!data.transactionId || !url) throw new Error("platega create: no transaction");
  return { tx: String(data.transactionId), url: String(url) };
}

export async function transactionStatus(tx: string, timeoutMs = 8000): Promise<string> {
  const res = await fetch(`${BASE}/transaction/${encodeURIComponent(tx)}`, { headers: headers(), signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
  if (!res.ok) throw new Error(`platega status ${res.status}`);
  const data = (await res.json()) as { status?: string };
  return String(data.status ?? "").toUpperCase();
}
