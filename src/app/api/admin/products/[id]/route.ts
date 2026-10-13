import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { AdminProductService } from "@/services/admin-products.service";
import { jsonSuccess, jsonError, AppError, ERROR_CODES } from "@/lib/api-response";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const productId = parseInt(id, 10);
    if (isNaN(productId) || productId <= 0) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, "Invalid product ID", 400);
    }

    const product = await AdminProductService.getProductById(productId);
    return jsonSuccess({ ok: true, data: product });
  } catch (error) {
    if (error instanceof AppError) {
      return jsonError(error.code, error.message, error.status, error.details);
    }
    console.error("Admin get product error:", error);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "Failed to get product", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const productId = parseInt(id, 10);
    if (isNaN(productId) || productId <= 0) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, "Invalid product ID", 400);
    }

    const body = await request.json().catch(() => ({}));
    const updated = await AdminProductService.updateProduct(productId, body);

    return jsonSuccess({ ok: true, data: updated });
  } catch (error) {
    if (error instanceof AppError) {
      return jsonError(error.code, error.message, error.status, error.details);
    }
    console.error("Admin update product error:", error);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "Failed to update product", 500);
  }
}
