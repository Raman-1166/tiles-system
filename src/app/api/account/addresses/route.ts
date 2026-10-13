import { NextRequest } from "next/server";
import { getCustomerSessionServer } from "@/lib/customer-session";
import { CustomerService } from "@/services/customer.service";
import { jsonSuccess, jsonError, AppError, ERROR_CODES } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const session = await getCustomerSessionServer();
    if (!session) {
      throw new AppError(ERROR_CODES.UNAUTHORIZED, "Customer login required", 401);
    }

    const body = await request.json().catch(() => ({}));
    const newAddress = await CustomerService.addAddress(session.customerId, body);

    return jsonSuccess({ ok: true, data: newAddress }, 201);
  } catch (error) {
    if (error instanceof AppError) {
      return jsonError(error.code, error.message, error.status, error.details);
    }
    console.error("Add customer address error:", error);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "Failed to add address", 500);
  }
}
