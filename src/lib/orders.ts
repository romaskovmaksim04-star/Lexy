import "server-only";
import { db } from "./db";
import { FAILED, PAID, transactionStatus } from "./platega";
import { esc, notifyOwners } from "./notify";

// Order lifecycle: pending → paid (premium added once) | failed. Activation is
// idempotent: the status flip is a conditional update, so two checks cannot both grant.

const MONTH = 30 * 86_400_000;
const EXPIRE_MS = 26 * 3_600_000;

async function grantMonth(userId: string, planKey: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const from = user.premiumUntil && user.premiumUntil > new Date() ? user.premiumUntil : new Date();
  // Pro+ bought on top of Pro keeps the higher tier
  const tier = planKey === "proplus" || user.plan === "proplus" ? "proplus" : "pro";
  await db.user.update({ where: { id: userId }, data: { plan: tier, premiumUntil: new Date(from.getTime() + MONTH) } });
}

/** Checks one order with Platega and applies the result. Returns the order's status. */
export async function settleOrder(orderId: string): Promise<"pending" | "paid" | "failed"> {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return "failed";
  if (order.status !== "pending") return order.status as "paid" | "failed";
  if (!order.extId) return "pending";
  let status = "";
  try {
    status = await transactionStatus(order.extId);
  } catch {
    return "pending";
  }
  if (PAID.has(status)) {
    const flipped = await db.order.updateMany({ where: { id: order.id, status: "pending" }, data: { status: "paid", paidAt: new Date() } });
    if (flipped.count) {
      await grantMonth(order.userId, order.planKey);
      const who = await db.user.findUnique({ where: { id: order.userId }, select: { email: true } });
      notifyOwners(`✅ оплата: <b>${order.amount} ₽</b>, ${esc(order.planKey === "proplus" ? "Pro+" : "Pro")}, ${esc(who?.email ?? order.userId)}`);
      // The friend who invited this user gets a month after this user's first payment
      const paidBefore = await db.order.count({ where: { userId: order.userId, status: "paid", id: { not: order.id } } });
      const buyer = await db.user.findUnique({ where: { id: order.userId } });
      if (!paidBefore && buyer?.referredBy) await grantMonth(buyer.referredBy, "pro");
    }
    return "paid";
  }
  if (FAILED.has(status) || Date.now() - order.createdAt.getTime() > EXPIRE_MS) {
    await db.order.updateMany({ where: { id: order.id, status: "pending" }, data: { status: "failed" } });
    return "failed";
  }
  return "pending";
}

/** Every pending order younger than the expiry window; used by the server timer. */
export async function settlePending(): Promise<{ checked: number; paid: number }> {
  const list = await db.order.findMany({ where: { status: "pending", extId: { not: null } }, orderBy: { createdAt: "desc" }, take: 50 });
  let paid = 0;
  for (const o of list) if ((await settleOrder(o.id)) === "paid") paid += 1;
  return { checked: list.length, paid };
}
