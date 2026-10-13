import { getDb } from "@/db";
import { products, productVariants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { AppError, ERROR_CODES } from "@/lib/api-response";
import {
  listProducts,
  getProductBySlug as dbGetProductBySlug,
  type ProductFilters,
} from "@/db/queries";

export class ProductService {
  /**
   * Get products list with sanitized public fields.
   */
  static async list(filters: ProductFilters = {}) {
    return listProducts(filters);
  }

  /**
   * Get a single active product by slug.
   */
  static async getBySlug(slug: string) {
    const product = await dbGetProductBySlug(slug);
    if (!product || !product.isActive) {
      throw new AppError(ERROR_CODES.NOT_FOUND, `Product not found: ${slug}`, 404);
    }
    return product;
  }

  /**
   * Validate that a product and optional variant exist, are active, and have sufficient stock.
   */
  static async validateForPurchase(
    productId: number,
    variantId?: number | null,
    quantity: number = 1
  ) {
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Quantity must be a positive integer", 400);
    }

    const { db } = getDb();
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.isActive, true)))
      .limit(1);

    if (!product) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        `Product ID ${productId} not found or inactive`,
        404
      );
    }

    if (variantId) {
      const [variant] = await db
        .select()
        .from(productVariants)
        .where(and(eq(productVariants.id, variantId), eq(productVariants.productId, productId)))
        .limit(1);

      if (!variant) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          `Variant ID ${variantId} does not belong to product ID ${productId}`,
          400
        );
      }

      if (variant.stockQuantity < quantity) {
        throw new AppError(
          ERROR_CODES.OUT_OF_STOCK,
          `Insufficient stock for "${product.name}" (${variant.size || variant.colour || "Standard"}). Available: ${variant.stockQuantity}, requested: ${quantity}`,
          400,
          { available: variant.stockQuantity, requested: quantity }
        );
      }

      const unitPriceCents = variant.salePriceCents ?? variant.priceCents;
      return { product, variant, unitPriceCents };
    }

    // Product without variant - use base price
    return { product, variant: null, unitPriceCents: product.priceCents };
  }
}
