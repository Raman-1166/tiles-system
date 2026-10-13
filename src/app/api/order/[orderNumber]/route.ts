import { NextRequest } from "next/server";
import { OrderService } from "@/services/order.service";
import { jsonError, jsonSuccess, AppError, ERROR_CODES } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const token = request.nextUrl.searchParams.get("token") || "";

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateLimit = await checkRateLimit(`order-get:${ip}`, { max: 30, intervalMs: 60_000 });
    if (!rateLimit.allowed) {
      return jsonError(ERROR_CODES.RATE_LIMITED, "Too many requests. Please slow down.", 429);
    }

    if (!token) {
      return jsonError(
        ERROR_CODES.UNAUTHORIZED,
        "Order access token required. Please view using your confirmation link.",
        401
      );
    }

    const data = await OrderService.getOrderWithToken(orderNumber, token);
    return jsonSuccess({ ok: true, ...data });
  } catch (error) {
    if (error instanceof AppError) {
      return jsonError(error.code, error.message, error.status);
    }
    console.error("Get order error:", error);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "An error occurred retrieving the order", 500);
  }
}
