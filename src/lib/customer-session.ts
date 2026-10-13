import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";

export const CUSTOMER_COOKIE = "customer_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  // Use ORDER_TOKEN_SECRET or fallback to ADMIN_SESSION_SECRET
  const s = process.env.ORDER_TOKEN_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("A cryptographic secret is required for customer session signing");
  return s;
}

export interface CustomerSessionPayload {
  customerId: number;
  email: string;
}

export function signCustomerSession(customerId: number, email: string): string {
  const expires = Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE;
  const payload = `${customerId}:${email.toLowerCase()}:${expires}`;
  const mac = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${mac}`;
}

export function verifyCustomerSession(signed: string): CustomerSessionPayload | null {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return null;

  const payload = signed.slice(0, lastDot);
  const expectedMac = createHmac("sha256", getSecret()).update(payload).digest("hex");
  const expected = Buffer.from(`${payload}.${expectedMac}`);
  const actual = Buffer.from(signed);

  if (expected.length !== actual.length) return null;
  try {
    if (!timingSafeEqual(expected, actual)) return null;
  } catch {
    return null;
  }

  const [idStr, email, expiresStr] = payload.split(":");
  const customerId = parseInt(idStr, 10);
  const expires = parseInt(expiresStr, 10);

  if (isNaN(customerId) || !email || isNaN(expires)) return null;
  if (Date.now() / 1000 > expires) return null;

  return { customerId, email };
}

/** Check customer session from Next.js cookies() in Route Handlers or Server Components */
export async function getCustomerSessionServer(): Promise<CustomerSessionPayload | null> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const cookie = store.get(CUSTOMER_COOKIE)?.value;
  if (!cookie) return null;
  return verifyCustomerSession(cookie);
}

/** Attach the signed customer session cookie onto an outgoing response */
export function setCustomerSessionCookie(
  response: NextResponse,
  customerId: number,
  email: string
): void {
  const token = signCustomerSession(customerId, email);
  response.cookies.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

/** Clear the customer session cookie */
export function clearCustomerSessionCookie(response: NextResponse): void {
  response.cookies.set(CUSTOMER_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
}
