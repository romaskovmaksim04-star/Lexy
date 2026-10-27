import "server-only";
import { redirect } from "next/navigation";
import { currentUser } from "./auth";

// The two owners; LEXY_ADMINS (comma-separated emails) overrides the list
const ADMINS = (process.env.LEXY_ADMINS ?? "nelxikfun@gmail.com,romaskovmaksim35@gmail.com").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

export function isAdmin(email: string | undefined | null): boolean {
  return !!email && ADMINS.includes(email.toLowerCase());
}

/** The signed-in admin, or a 404-like bounce for everyone else. */
export async function requireAdmin() {
  const user = await currentUser();
  if (!user || !isAdmin(user.email)) redirect("/app");
  return user;
}
