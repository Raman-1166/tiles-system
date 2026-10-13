import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";

export const ADMIN_COOKIE = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

function getSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("ADMIN_SESSION_SECRET is required");
  return s;
}

function sign(payload: string): string {
  const mac = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${mac}`;
}

function verify(signed: string): string | null {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return null;
  const payload = signed.slice(0, lastDot);
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signed);
  if (expected.length !== actual.length) return null;
  try {
    if (!timingSafeEqual(expected, actual)) return null;
  } catch {
    return null;
  }
  return payload;
}

export function checkAdminPassword(password: string): boolean {
  const correct = process.env.ADMIN_PASSWORD;
  if (!correct) return false;
  try {
    return timingSafeEqual(Buffer.from(password), Buffer.from(correct));
  } catch {
    return false;
  }
}

/** Check admin session from Next.js cookies() (Server Components & Server Actions). */
export async function isAdminSessionServer(): Promise<boolean> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const cookie = store.get(ADMIN_COOKIE)?.value;
  if (!cookie) return false;
  const payload = verify(cookie);
  if (!payload) return false;
  const [role, expiresStr] = payload.split(":");
  if (role !== "admin") return false;
  const expires = parseInt(expiresStr, 10);
  if (Date.now() / 1000 > expires) return false;
  return true;
}

/** Write the signed admin session cookie onto a response. */
export function setAdminSessionCookie(response: NextResponse): void {
  const expires = Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE;
  const token = sign(`admin:${expires}`);
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

/** Clear the admin session cookie. */
export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
