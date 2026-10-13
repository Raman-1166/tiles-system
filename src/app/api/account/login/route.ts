import { NextRequest } from "next/server";
import { CustomerService } from "@/services/customer.service";
import { setCustomerSessionCookie } from "@/lib/customer-session";
import { jsonSuccess, jsonError, AppError, ERROR_CODES } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, "Email and password are required", 400);
    }

    const customer = await CustomerService.login({ email, password });

    const response = jsonSuccess({ ok: true, data: customer });
    setCustomerSessionCookie(response, customer.id, customer.email);
    return response;
  } catch (error) {
    if (error instanceof AppError) {
      return jsonError(error.code, error.message, error.status, error.details);
    }
    console.error("Customer login error:", error);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "Login failed", 500);
  }
}
