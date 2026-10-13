import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { AdminProductService } from "@/services/admin-products.service";
import { jsonSuccess, jsonError, AppError, ERROR_CODES } from "@/lib/api-response";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const variantId = parseInt(id, 10);
    if (isNaN(variantId) || variantId <= 0) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, "Invalid variant ID", 400);
    }

    const body = await request.json().catch(() => ({}));
    const { stockQuantity, priceCents, salePriceCents, lowStockThreshold } = body;

    const updated = await AdminProductService.updateVariantStock(variantId, {
      stockQuantity: stockQuantity !== undefined ? parseInt(String(stockQuantity), 10) : undefined,
      priceCents: priceCents !== undefined ? parseInt(String(priceCents), 10) : undefined,
      salePriceCents:
        salePriceCents !== undefined
          ? salePriceCents === null
            ? null
            : parseInt(String(salePriceCents), 10)
          : undefined,
      lowStockThreshold:
        lowStockThreshold !== undefined ? parseInt(String(lowStockThreshold), 10) : undefined,
    });

    return jsonSuccess({ ok: true, data: updated });
  } catch (error) {
    if (error instanceof AppError) {
      return jsonError(error.code, error.message, error.status, error.details);
    }
    console.error("Admin variant stock update error:", error);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "Failed to update variant stock", 500);
  }
}
