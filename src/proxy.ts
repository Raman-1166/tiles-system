import { NextRequest, NextResponse } from "next/server";

export const ADMIN_COOKIE = "admin_session";

/**
 * Edge-compatible HMAC-SHA256 check using SubtleCrypto (Web Crypto API).
 * Proxy runs on the Edge Runtime — no node:crypto allowed.
 */
async function hmacSha256(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyToken(signed: string, secret: string): Promise<string | null> {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return null;
  const payload = signed.slice(0, lastDot);
  const mac = signed.slice(lastDot + 1);
  const expected = await hmacSha256(secret, payload);
  // Constant-time compare via encode + XOR
  if (expected.length !== mac.length) return null;
  const a = new TextEncoder().encode(expected);
  const b = new TextEncoder().encode(mac);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  if (diff !== 0) return null;
  return payload;
}

export async function isAdminSessionEdge(request: NextRequest): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;
  const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!cookie) return false;
  const payload = await verifyToken(cookie, secret);
  if (!payload) return false;
  const [role, expiresStr] = payload.split(":");
  if (role !== "admin") return false;
  const expires = parseInt(expiresStr, 10);
  if (Date.now() / 1000 > expires) return false;
  return true;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const ok = await isAdminSessionEdge(request);
    if (!ok) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
