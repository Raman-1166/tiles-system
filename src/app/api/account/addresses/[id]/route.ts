import { NextRequest } from "next/server";
import { getCustomerSessionServer } from "@/lib/customer-session";
import { CustomerService } from "@/services/customer.service";
import { jsonSuccess, jsonError, AppError, ERROR_CODES } from "@/lib/api-response";

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getCustomerSessionServer();
    if (!session) {
      throw new AppError(ERROR_CODES.UNAUTHORIZED, "Customer login required", 401);
    }

    const { id } = await params;
    const addressId = parseInt(id, 10);
    if (isNaN(addressId) || addressId <= 0) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, "Invalid address ID", 400);
    }

    await CustomerService.deleteAddress(session.customerId, addressId);
    return jsonSuccess({ ok: true, message: "Address deleted successfully" });
  } catch (error) {
    if (error instanceof AppError) {
      return jsonError(error.code, error.message, error.status, error.details);
    }
    console.error("Delete customer address error:", error);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "Failed to delete address", 500);
  }
}
