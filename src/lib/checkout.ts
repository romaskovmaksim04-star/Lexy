import "server-only";
import { db } from "./db";
import { plan as planByKey, discounted } from "./pricing";

/** Price for this user: the wheel discount or the invite discount applies to the first payment only. */
export async function priceFor(userId: string, planKey: string): Promise<{ amount: number; percent: number } | null> {
  const p = planByKey(planKey);
  if (!p || !p.price) return null;
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  const paid = await db.order.count({ where: { userId, status: "paid" } });
  const percent = paid ? 0 : Math.max(user.discount, user.referredBy ? 15 : 0);
  return { amount: discounted(p.price, percent), percent };
}

