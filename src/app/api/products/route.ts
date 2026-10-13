import { NextRequest } from "next/server";
import { ProductService } from "@/services/product.service";
import { listCategories } from "@/db/queries";
import { jsonError, jsonSuccess, ERROR_CODES } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categorySlug = searchParams.get("category");
    const typeParam = searchParams.get("type");
    const type = typeParam === "tile" || typeParam === "furniture" ? typeParam : undefined;
    const search = searchParams.get("search") || searchParams.get("q") || undefined;
    const sortParam = searchParams.get("sort");
    const sort =
      sortParam === "newest" || sortParam === "price_asc" || sortParam === "price_desc"
        ? sortParam
        : undefined;

    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    let categoryId: number | undefined;
    if (categorySlug) {
      const allCategories = await listCategories();
      const matchedCategory = allCategories.find((c) => c.slug === categorySlug);
      categoryId = matchedCategory?.id;
    }

    if (pageParam !== null || limitParam !== null) {
      const page = Math.max(1, Number(pageParam) || 1);
      const limit = Math.min(100, Math.max(1, Number(limitParam) || 12));

      const result = await ProductService.listPaginated({
        categoryId,
        type,
        search,
        sort,
        page,
        limit,
      });

      return jsonSuccess(
        {
          products: result.products,
          pagination: result.pagination,
        },
        200,
        true
      );
    }

    const items = await ProductService.list({
      categoryId,
      type,
      search,
      sort,
    });

    return jsonSuccess({ products: items }, 200, true);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "Failed to load products", 500);
  }
}
