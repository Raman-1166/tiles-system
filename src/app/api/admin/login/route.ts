import { NextRequest, NextResponse } from "next/server";
import { checkAdminPassword, setAdminSessionCookie } from "@/lib/admin-session";
import { checkRateLimit } from "@/lib/rate-limit";
import { jsonError, jsonSuccess, ERROR_CODES } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateLimit = await checkRateLimit(`admin-login:${ip}`, { max: 5, intervalMs: 60_000 });

    if (!rateLimit.allowed) {
      return jsonError(
        ERROR_CODES.RATE_LIMITED,
        `Too many login attempts. Please try again in ${Math.ceil(rateLimit.resetMs / 1000)} seconds.`,
        429
      );
    }

    const body = await request.json().catch(() => null);
    const password: unknown = body?.password;

    if (typeof password !== "string" || !(await checkAdminPassword(password))) {
      return jsonError(ERROR_CODES.UNAUTHORIZED, "Invalid admin password", 401);
    }

    const response = jsonSuccess({ ok: true });
    setAdminSessionCookie(response);
    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "An error occurred during authentication", 500);
  }
}
