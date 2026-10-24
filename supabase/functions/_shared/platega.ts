const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE_URL = (Deno.env.get("LEXY_SITE_URL") || "https://romaskovmaksim04-star.github.io/Lexy").replace(/\/+$/, "");
const PLATEGA_BASE = (Deno.env.get("PLATEGA_API_BASE") || "https://app.platega.io").replace(/\/+$/, "");

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

export function preflight(): Response {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function readJson(req: Request): Promise<Record<string, any>> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function serviceHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export async function rest(path: string, init: RequestInit = {}): Promise<any> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: serviceHeaders(init.headers as Record<string, string> || {}),
  });
  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    const error = new Error(`Supabase REST ${response.status}`);
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }
  return data;
}

export async function authUser(req: Request): Promise<any | null> {
  const header = req.headers.get("Authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const user = await response.json();
  return user && user.id ? user : null;
}

export async function platega(path: string, init: RequestInit = {}): Promise<any> {
  const merchant = Deno.env.get("PLATEGA_MERCHANT_ID") || "";
  const secret = Deno.env.get("PLATEGA_API_KEY") || "";
  if (!merchant || !secret) throw new Error("Platega credentials are not configured");
  const response = await fetch(`${PLATEGA_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-MerchantId": merchant,
      "X-Secret": secret,
      ...(init.headers as Record<string, string> || {}),
    },
  });
  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    const error = new Error(`Platega ${response.status}`);
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }
  return data;
}

export const PLAN_PRICES: Record<string, number> = {
  pro: 490,
  pro_plus: 1590,
};

export const PLAN_NAMES: Record<string, string> = {
  pro: "Pro",
  pro_plus: "Pro+",
};

export function siteUrl(): string {
  return SITE_URL;
}
