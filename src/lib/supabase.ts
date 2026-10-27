import "server-only";

// Maks's Supabase project is the identity provider for Google sign-in and email codes, and
// holds the accounts made on his static site. We only verify its tokens and read profiles;
// sessions, progress and payments live in our own database.

const URL_ = (process.env.SUPABASE_URL ?? "").replace(/\/+$/, "");
const PUB = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
const SECRET = process.env.SUPABASE_SECRET_KEY ?? "";

export function supabaseOn(): boolean {
  return !!(URL_ && PUB);
}

async function call(path: string, init: RequestInit & { secret?: boolean } = {}) {
  const key = init.secret ? SECRET : PUB;
  return fetch(URL_ + path, {
    ...init,
    headers: { apikey: key, "Content-Type": "application/json", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
}

/** Sends a 6-digit sign-in code. Returns an error text for the form, or null. */
export async function sendCode(email: string): Promise<string | null> {
  const r = await call("/auth/v1/otp", { method: "POST", body: JSON.stringify({ email, create_user: true }) }).catch(() => null);
  if (!r) return "Почта сейчас недоступна, попробуй через минуту";
  if (r.status === 429) return "Слишком много писем. Подожди минуту и попробуй снова";
  return r.ok ? null : "Не получилось отправить код. Проверь адрес";
}

/** Exchanges the emailed code for an access token. */
export async function verifyCode(email: string, code: string): Promise<string | null> {
  const r = await call("/auth/v1/verify", { method: "POST", body: JSON.stringify({ type: "email", email, token: code }) }).catch(() => null);
  if (!r?.ok) return null;
  const d = await r.json().catch(() => null);
  return typeof d?.access_token === "string" ? d.access_token : null;
}

export type SupaUser = { id: string; email: string; name: string; google: boolean };

export async function userFromToken(token: string): Promise<SupaUser | null> {
  const r = await call("/auth/v1/user", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
  if (!r?.ok) return null;
  const u = await r.json().catch(() => null);
  if (!u?.id || !u?.email) return null;
  const m = u.user_metadata ?? {};
  return {
    id: u.id,
    email: String(u.email).toLowerCase(),
    name: String(m.full_name || m.name || "").trim(),
    google: (u.app_metadata?.providers ?? []).includes("google"),
  };
}

export type SupaProfile = {
  name: string; plan: string; plan_expires_at: string | null; path: string | null;
  target: number | null; exam_date: string | null; lang: string | null;
};

/** The account row from Maks's site, if this person used it. */
export async function profileOf(id: string): Promise<SupaProfile | null> {
  if (!SECRET) return null;
  const q = `/rest/v1/profiles?id=eq.${encodeURIComponent(id)}&select=name,plan,plan_expires_at,path,target,exam_date,lang`;
  const r = await call(q, { secret: true, headers: { Authorization: `Bearer ${SECRET}` } }).catch(() => null);
  if (!r?.ok) return null;
  const rows = await r.json().catch(() => []);
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

/** Where the Google button sends the browser; Supabase comes back to /auth/callback with a token. */
export function googleUrl(origin: string, next: string): string {
  const back = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
  return `${URL_}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(back)}`;
}
