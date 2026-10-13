import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { AdminOrderService } from "@/services/admin-orders.service";
import { jsonSuccess, jsonError, AppError, ERROR_CODES } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const fulfillmentStatus = searchParams.get("fulfillmentStatus") || undefined;
    const paymentStatus = searchParams.get("paymentStatus") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);

    const result = await AdminOrderService.listOrders({
      fulfillmentStatus,
      paymentStatus,
      search,
      page,
      limit,
    });

    return jsonSuccess({ ok: true, data: result });
  } catch (error) {
    if (error instanceof AppError) {
      return jsonError(error.code, error.message, error.status, error.details);
    }
    console.error("Admin orders list error:", error);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "Failed to list orders", 500);
  }
}
