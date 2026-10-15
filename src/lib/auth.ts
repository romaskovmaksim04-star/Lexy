import { cache } from "react";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";

const COOKIE = "lexy_session";
const MAX_AGE = 60 * 60 * 24 * 30;

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET is not set");
    return new TextEncoder().encode("lexy-dev-secret");
  }
  return new TextEncoder().encode(s);
}

export async function startSession(userId: string) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function sessionUserId(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.uid === "string" ? payload.uid : null;
  } catch {
    return null;
  }
}

/** The signed-in user, or null. Cached for the duration of one request. */
export const currentUser = cache(async () => {
  const id = await sessionUserId();
  if (!id) return null;
  return db.user.findUnique({ where: { id } });
});
