import { getDb } from "@/db";
import {
  products,
  productVariants,
  categories,
  type NewProduct,
  type NewProductVariant,
} from "@/db/schema";
import { eq, desc, and, like, sql } from "drizzle-orm";
import { AppError, ERROR_CODES } from "@/lib/api-response";

export interface CreateProductInput {
  name: string;
  slug: string;
  description: string;
  tagline?: string;
  categoryId: number;
  priceCents: number;
  soldBy?: "unit" | "box" | "sqm";
  unit?: string;
  coveragePerBoxSqm?: string;
  material?: string;
  finish?: string;
  specs?: Record<string, string>;
  isActive?: boolean;
  initialStock?: number;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  tagline?: string;
  categoryId?: number;
  priceCents?: number;
  soldBy?: "unit" | "box" | "sqm";
  unit?: string;
  coveragePerBoxSqm?: string;
  material?: string;
  finish?: string;
  specs?: Record<string, string>;
  isActive?: boolean;
}

export interface UpdateVariantStockInput {
  stockQuantity?: number;
  lowStockThreshold?: number;
  priceCents?: number;
  salePriceCents?: number | null;
}

export class AdminProductService {
  /**
   * List all products with their variants for the admin inventory editor.
   */
  static async listProducts(
    params: {
      search?: string;
      categoryId?: number;
      isActive?: boolean;
      limit?: number;
      page?: number;
    } = {}
  ) {
    const { db } = getDb();
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(200, Math.max(1, params.limit || 50));
    const offset = (page - 1) * limit;

    const conditions = [];

    if (params.categoryId) {
      conditions.push(eq(products.categoryId, params.categoryId));
    }

    if (params.isActive !== undefined) {
      conditions.push(eq(products.isActive, params.isActive));
    }

    if (params.search && params.search.trim()) {
      const q = `%${params.search.trim()}%`;
      conditions.push(like(products.name, q));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const productRows = await db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    const categoriesRows = await db.select().from(categories);
    const categoryMap = new Map(categoriesRows.map((c) => [c.id, c]));

    const productsWithDetails = await Promise.all(
      productRows.map(async (p) => {
        const variants = await db
          .select()
          .from(productVariants)
          .where(eq(productVariants.productId, p.id));
        return {
          ...p,
          category: categoryMap.get(p.categoryId) || null,
          productVariants: variants,
          totalStock: variants.reduce((sum, v) => sum + v.stockQuantity, 0),
        };
      })
    );

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause);

    return {
      products: productsWithDetails,
      categories: categoriesRows,
      pagination: {
        page,
        limit,
        total: Number(countResult?.count || 0),
      },
    };
  }

  /**
   * Create a new catalog product with its default variant.
   */
  static async createProduct(input: CreateProductInput) {
    const { db } = getDb();

    // Verify unique slug
    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.slug, input.slug))
      .limit(1);

    if (existing) {
      throw new AppError(
        ERROR_CODES.CONFLICT,
        `A product with slug "${input.slug}" already exists`,
        409
      );
    }

    // Insert product
    const [inserted] = await db.insert(products).values({
      name: input.name,
      slug: input.slug,
      description: input.description,
      tagline: input.tagline || "",
      categoryId: input.categoryId,
      priceCents: input.priceCents,
      soldBy: input.soldBy || "unit",
      unit: input.unit || "unit",
      coveragePerBoxSqm: input.coveragePerBoxSqm || null,
      material: input.material || null,
      finish: input.finish || null,
      images: [],
      variants: [],
      specs: input.specs || {},
      isActive: input.isActive !== undefined ? input.isActive : true,
    });

    const newProductId = inserted.insertId;

    // Create default SKU variant
    const defaultSku = `${input.slug.toUpperCase()}-STD`;
    await db.insert(productVariants).values({
      productId: newProductId,
      sku: defaultSku,
      size: "Standard",
      colour: "Default",
      finish: input.finish || "Standard",
      priceCents: input.priceCents,
      stockQuantity: input.initialStock ?? 25,
      lowStockThreshold: 10,
    });

    return this.getProductById(newProductId);
  }

  /**
   * Update product details.
   */
  static async updateProduct(id: number, input: UpdateProductInput) {
    const { db } = getDb();

    const [existing] = await db.select().from(products).where(eq(products.id, id)).limit(1);

    if (!existing) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Product not found", 404);
    }

    await db
      .update(products)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    return this.getProductById(id);
  }

  /**
   * Quick update of variant stock quantity and price (Variant Stock Editor).
   */
  static async updateVariantStock(variantId: number, input: UpdateVariantStockInput) {
    const { db } = getDb();

    const [existing] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, variantId))
      .limit(1);

    if (!existing) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Product variant not found", 404);
    }

    await db
      .update(productVariants)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(productVariants.id, variantId));

    const [updated] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, variantId))
      .limit(1);

    return updated;
  }

  /**
   * Get product by ID with full details.
   */
  static async getProductById(id: number) {
    const { db } = getDb();

    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);

    if (!product) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Product not found", 404);
    }

    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, product.categoryId))
      .limit(1);

    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, product.id));

    return {
      ...product,
      category: category || null,
      productVariants: variants,
      totalStock: variants.reduce((sum, v) => sum + v.stockQuantity, 0),
    };
  }
}
