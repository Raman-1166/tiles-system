import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE = "cart_session";

/** Read-only helper for Server Components (cannot create a cookie). */
export async function readSessionId(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

/**
 * Helper for Route Handlers: reads the session id from the incoming request
 * and, if missing, generates one and writes it onto the outgoing response.
 */
export function getOrCreateSessionId(
  request: NextRequest,
  response: NextResponse
): string {
  const existing = request.cookies.get(SESSION_COOKIE)?.value;
  if (existing) return existing;

  const id = randomUUID();
  response.cookies.set(SESSION_COOKIE, id, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return id;
}
