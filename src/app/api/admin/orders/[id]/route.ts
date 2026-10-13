import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { AdminOrderService, type ValidFulfillmentStatus } from "@/services/admin-orders.service";
import { jsonSuccess, jsonError, AppError, ERROR_CODES } from "@/lib/api-response";

interface Params {
  params: Promise<{ id: string }>;
}

const VALID_STATUSES: ValidFulfillmentStatus[] = [
  "unfulfilled",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "on_hold",
];

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId) || orderId <= 0) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, "Invalid order ID", 400);
    }

    const details = await AdminOrderService.getOrderDetails(orderId);
    return jsonSuccess({ ok: true, data: details });
  } catch (error) {
    if (error instanceof AppError) {
      return jsonError(error.code, error.message, error.status, error.details);
    }
    console.error("Admin order detail error:", error);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "Failed to get order details", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId) || orderId <= 0) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, "Invalid order ID", 400);
    }

    const body = await request.json().catch(() => ({}));
    const { fulfillmentStatus, trackingNumber, note } = body;

    if (!fulfillmentStatus || !VALID_STATUSES.includes(fulfillmentStatus)) {
      throw new AppError(
        ERROR_CODES.BAD_REQUEST,
        `Invalid fulfillmentStatus. Must be one of: ${VALID_STATUSES.join(", ")}`,
        400
      );
    }

    const updated = await AdminOrderService.updateFulfillment(orderId, {
      fulfillmentStatus,
      trackingNumber,
      note,
      actor: "admin",
    });

    return jsonSuccess({ ok: true, data: updated });
  } catch (error) {
    if (error instanceof AppError) {
      return jsonError(error.code, error.message, error.status, error.details);
    }
    console.error("Admin order update error:", error);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "Failed to update order", 500);
  }
}
