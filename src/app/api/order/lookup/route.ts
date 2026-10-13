import { NextRequest } from "next/server";
import { z } from "zod";
import { OrderService } from "@/services/order.service";
import { checkRateLimit } from "@/lib/rate-limit";
import { jsonError, jsonSuccess, AppError, ERROR_CODES } from "@/lib/api-response";

const lookupSchema = z.object({
  orderNumber: z.string().min(5, "Order number is required"),
  email: z.string().email("Valid email address is required"),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    // Rate limit lookups to prevent brute-force order enumeration
    const rateLimit = await checkRateLimit(`order-lookup:${ip}`, { max: 6, intervalMs: 60_000 });
    if (!rateLimit.allowed) {
      return jsonError(
        ERROR_CODES.RATE_LIMITED,
        `Too many lookup attempts. Please wait ${Math.ceil(rateLimit.resetMs / 1000)} seconds.`,
        429
      );
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = lookupSchema.safeParse(body);
    if (!parseResult.success) {
      return jsonError(ERROR_CODES.VALIDATION_ERROR, "Invalid order number or email format", 400);
    }

    const { orderNumber, email } = parseResult.data;
    const result = await OrderService.lookupByEmail(orderNumber, email);

    return jsonSuccess({
      ok: true,
      order: result.order,
      items: result.items,
      token: result.token,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return jsonError(error.code, error.message, error.status);
    }
    console.error("Order lookup error:", error);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "An error occurred during lookup", 500);
  }
}
