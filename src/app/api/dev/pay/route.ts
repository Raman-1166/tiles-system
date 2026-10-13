import { NextRequest } from "next/server";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { OrderService } from "@/services/order.service";
import { createOrderToken } from "@/lib/order-token";
import { jsonError, jsonSuccess, ERROR_CODES } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return jsonError(ERROR_CODES.FORBIDDEN, "Mock payment endpoint is disabled in production", 403);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { orderNumber } = body;

    if (!orderNumber || typeof orderNumber !== "string") {
      return jsonError(ERROR_CODES.VALIDATION_ERROR, "orderNumber is required", 400);
    }

    const { db } = getDb();
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);

    if (!order) {
      return jsonError(ERROR_CODES.NOT_FOUND, "Order not found", 404);
    }

    const mockPaymentId = `mock_pay_${order.orderNumber}_${Date.now()}`;

    // Execute same atomic fulfillment pipeline as Stripe webhook
    const result = await OrderService.fulfillPayment({
      orderNumber: order.orderNumber,
      provider: "mock",
      providerPaymentId: mockPaymentId,
      amountCents: order.totalCents,
      currency: order.currency,
    });

    const token = createOrderToken(order.orderNumber);

    return jsonSuccess({
      ok: true,
      orderNumber: order.orderNumber,
      paymentStatus: result.order.paymentStatus,
      fulfillmentStatus: result.order.fulfillmentStatus,
      token,
      redirectUrl: `/order/${order.orderNumber}?token=${token}`,
    });
  } catch (error: any) {
    console.error("Mock pay error:", error);
    return jsonError(
      ERROR_CODES.INTERNAL_ERROR,
      error.message || "Failed to simulate payment",
      500
    );
  }
}
