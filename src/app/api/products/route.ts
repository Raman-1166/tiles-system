import { NextRequest } from "next/server";
import { ProductService } from "@/services/product.service";
import { listCategories } from "@/db/queries";
import { jsonError, jsonSuccess, ERROR_CODES } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const categorySlug = request.nextUrl.searchParams.get("category");

    let categoryId: number | undefined;
    if (categorySlug) {
      const allCategories = await listCategories();
      const matchedCategory = allCategories.find((c) => c.slug === categorySlug);
      categoryId = matchedCategory?.id;
    }

    const items = await ProductService.list({ categoryId });
    return jsonSuccess({ products: items }, 200, true);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "Failed to load products", 500);
  }
}
