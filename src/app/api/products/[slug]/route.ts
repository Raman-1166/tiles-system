import { ProductService } from "@/services/product.service";
import { jsonError, jsonSuccess, AppError, ERROR_CODES } from "@/lib/api-response";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const product = await ProductService.getBySlug(slug);
    return jsonSuccess({ product }, 200, true);
  } catch (error) {
    if (error instanceof AppError) {
      return jsonError(error.code, error.message, error.status);
    }
    console.error("GET /api/products/[slug] error:", error);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "Failed to load product", 500);
  }
}
