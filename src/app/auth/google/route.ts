import { NextResponse, type NextRequest } from "next/server";
import { googleUrl, supabaseOn } from "@/lib/supabase";
import { safeNext } from "@/lib/safe-next";

// The Google button: off to Supabase, which returns to /auth/callback
export function GET(req: NextRequest) {
  const next = safeNext(req.nextUrl.searchParams.get("next") ?? "");
  const origin = (process.env.SITE_URL ?? req.nextUrl.origin).replace(/\/+$/, "");
  if (!supabaseOn()) return NextResponse.redirect(`${origin}/login`);
  return NextResponse.redirect(googleUrl(origin, next));
}
