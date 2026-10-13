import { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";
import { CartService } from "@/services/cart.service";
import { jsonError, jsonSuccess, ERROR_CODES } from "@/lib/api-response";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionId) {
      return jsonError(ERROR_CODES.BAD_REQUEST, "No active cart session", 400);
    }

    const body = await request.json().catch(() => null);
    const quantity = Math.floor(Number(body?.quantity));
    if (Number.isNaN(quantity)) {
      return jsonError(ERROR_CODES.VALIDATION_ERROR, "quantity is required", 400);
    }

    await CartService.updateQuantity(Number(id), sessionId, quantity);
    const lines = await CartService.getLines(sessionId);
    const totals = CartService.calculateTotals(lines);

    return jsonSuccess({
      ok: true,
      count: totals.itemCount,
      totalCents: totals.totalCents,
      subtotalCents: totals.subtotalCents,
    });
  } catch (error) {
    console.error("PATCH /api/cart/[id] error:", error);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "Failed to update item quantity", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionId) {
      return jsonError(ERROR_CODES.BAD_REQUEST, "No active cart session", 400);
    }

    await CartService.removeItem(Number(id), sessionId);
    const lines = await CartService.getLines(sessionId);
    const totals = CartService.calculateTotals(lines);

    return jsonSuccess({
      ok: true,
      count: totals.itemCount,
      totalCents: totals.totalCents,
      subtotalCents: totals.subtotalCents,
    });
  } catch (error) {
    console.error("DELETE /api/cart/[id] error:", error);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "Failed to remove cart item", 500);
  }
}
