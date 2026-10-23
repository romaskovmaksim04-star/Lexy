import { timingSafeEqual } from "node:crypto";
import { settlePending } from "@/lib/orders";
import { paymentsEnabled } from "@/lib/platega";

// Called by a systemd timer on the server, so payments are applied even when the
// buyer never comes back to the return page.
export async function POST(req: Request) {
  const want = process.env.CRON_SECRET ?? "";
  const got = req.headers.get("x-lexy-cron") ?? "";
  if (!want || want.length !== got.length || !timingSafeEqual(Buffer.from(want), Buffer.from(got))) {
    return new Response("forbidden", { status: 403 });
  }
  if (!paymentsEnabled()) return Response.json({ checked: 0, paid: 0, disabled: true });
  return Response.json(await settlePending());
}
