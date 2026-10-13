import { NextRequest } from "next/server";
import { CustomerService } from "@/services/customer.service";
import { setCustomerSessionCookie } from "@/lib/customer-session";
import { jsonSuccess, jsonError, AppError, ERROR_CODES } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, name, phone } = body;

    const customer = await CustomerService.register({
      email,
      password,
      name,
      phone,
    });

    const response = jsonSuccess({ ok: true, data: customer }, 201);
    setCustomerSessionCookie(response, customer.id, customer.email);
    return response;
  } catch (error) {
    if (error instanceof AppError) {
      return jsonError(error.code, error.message, error.status, error.details);
    }
    console.error("Customer registration error:", error);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "Registration failed", 500);
  }
}
