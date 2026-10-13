import { NextRequest } from "next/server";
import { clearCustomerSessionCookie } from "@/lib/customer-session";
import { jsonSuccess } from "@/lib/api-response";

export async function POST(_request: NextRequest) {
  const response = jsonSuccess({ ok: true, message: "Logged out successfully" });
  clearCustomerSessionCookie(response);
  return response;
}
