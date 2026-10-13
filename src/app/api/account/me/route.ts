import { NextRequest } from "next/server";
import { getCustomerSessionServer } from "@/lib/customer-session";
import { CustomerService } from "@/services/customer.service";
import { jsonSuccess, jsonError, AppError, ERROR_CODES } from "@/lib/api-response";

export async function GET(_request: NextRequest) {
  try {
    const session = await getCustomerSessionServer();
    if (!session) {
      throw new AppError(ERROR_CODES.UNAUTHORIZED, "Customer login required", 401);
    }

    const profile = await CustomerService.getProfile(session.customerId);
    return jsonSuccess({ ok: true, data: profile });
  } catch (error) {
    if (error instanceof AppError) {
      return jsonError(error.code, error.message, error.status, error.details);
    }
    console.error("Get customer profile error:", error);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch customer profile", 500);
  }
}
