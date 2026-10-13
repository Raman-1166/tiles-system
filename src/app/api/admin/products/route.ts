import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { AdminProductService } from "@/services/admin-products.service";
import { jsonSuccess, jsonError, AppError, ERROR_CODES } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || undefined;
    const categoryId = searchParams.get("categoryId")
      ? parseInt(searchParams.get("categoryId")!, 10)
      : undefined;
    const isActive = searchParams.has("isActive")
      ? searchParams.get("isActive") === "true"
      : undefined;

    const result = await AdminProductService.listProducts({
      search,
      categoryId,
      isActive,
    });

    return jsonSuccess({ ok: true, data: result });
  } catch (error) {
    if (error instanceof AppError) {
      return jsonError(error.code, error.message, error.status, error.details);
    }
    console.error("Admin products list error:", error);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "Failed to list products", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json().catch(() => ({}));
    const { name, slug, description, categoryId, priceCents } = body;

    if (!name || !slug || !description || !categoryId || !priceCents) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Name, slug, description, categoryId, and priceCents are required",
        400
      );
    }

    const created = await AdminProductService.createProduct({
      name,
      slug,
      description,
      tagline: body.tagline,
      categoryId: parseInt(String(categoryId), 10),
      priceCents: parseInt(String(priceCents), 10),
      soldBy: body.soldBy,
      unit: body.unit,
      coveragePerBoxSqm: body.coveragePerBoxSqm,
      material: body.material,
      finish: body.finish,
      specs: body.specs,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      initialStock: body.initialStock ? parseInt(String(body.initialStock), 10) : 25,
    });

    return jsonSuccess({ ok: true, data: created }, 201);
  } catch (error) {
    if (error instanceof AppError) {
      return jsonError(error.code, error.message, error.status, error.details);
    }
    console.error("Admin product create error:", error);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "Failed to create product", 500);
  }
}
