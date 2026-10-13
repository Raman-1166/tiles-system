import { NextRequest, NextResponse } from "next/server";
import { getOrCreateSessionId, SESSION_COOKIE } from "@/lib/session";
import { CartService } from "@/services/cart.service";
import { jsonError, jsonSuccess, AppError, ERROR_CODES } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get(SESSION_COOKIE)?.value ?? null;
    const lines = await CartService.getLines(sessionId);
    const totals = CartService.calculateTotals(lines);

    return jsonSuccess({
      lines,
      count: totals.itemCount,
      totalCents: totals.totalCents,
      subtotalCents: totals.subtotalCents,
    });
  } catch (error) {
    console.error("GET /api/cart error:", error);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "Failed to retrieve cart", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const productId = Number(body?.productId);
    const variantId = body?.variantId ? Number(body.variantId) : undefined;
    const quantity = Math.max(1, Math.floor(Number(body?.quantity) || 1));
    const variant = typeof body?.variant === "string" ? body.variant : null;
    const meta =
      body?.meta && typeof body.meta === "object" ? (body.meta as Record<string, unknown>) : null;

    if (!productId || Number.isNaN(productId)) {
      return jsonError(ERROR_CODES.VALIDATION_ERROR, "productId is required", 400);
    }

    const response = NextResponse.json({ ok: true });
    const sessionId = getOrCreateSessionId(request, response);

    const item = await CartService.addItem({
      sessionId,
      productId,
      variantId,
      quantity,
      variant,
      meta,
    });

    const lines = await CartService.getLines(sessionId);
    const totals = CartService.calculateTotals(lines);

    return NextResponse.json(
      {
        ok: true,
        item,
        count: totals.itemCount,
        totalCents: totals.totalCents,
        subtotalCents: totals.subtotalCents,
      },
      {
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return jsonError(error.code, error.message, error.status, error.details);
    }
    console.error("POST /api/cart error:", error);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "Failed to add item to cart", 500);
  }
}
