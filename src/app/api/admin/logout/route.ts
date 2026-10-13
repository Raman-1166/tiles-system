import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/admin-session";
import { jsonSuccess } from "@/lib/api-response";

export async function POST() {
  const response = jsonSuccess({ ok: true });
  clearAdminSessionCookie(response);
  return response;
}
