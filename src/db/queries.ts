import { getDb } from "@/db";
import {
  products,
  categories,
  productVariants,
  type Product,
  type Category,
  type ProductVariant,
} from "@/db/schema";
import { desc, eq, and, or, like, gte, lte, inArray, sql } from "drizzle-orm";

export type { ProductVariant };

export type ProductWithDetails = Omit<Product, "variants"> & {
  category: Category | null;
  productVariants: ProductVariant[];
};

export type ProductFilters = {
  categorySlug?: string;
  categoryId?: number;
  type?: "tile" | "furniture"; // Filter by category type
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  material?: string;
  colour?: string; // Filter by variant colour
  size?: string; // Filter by variant size
  inStock?: boolean;
  featured?: boolean;
  isActive?: boolean;
  sort?: "newest" | "price_asc" | "price_desc"; // Sorting
  page?: number; // Pagination (1-indexed)
  limit?: number;
  offset?: number;
};

function buildProductWhereClause(filters: ProductFilters) {
  const conditions = [];

  // Always show only active products by default
  if (filters.isActive !== false) {
    conditions.push(eq(products.isActive, true));
  }

  if (filters.categoryId) {
    conditions.push(eq(products.categoryId, filters.categoryId));
  }

  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        like(products.name, searchTerm),
        like(products.description, searchTerm),
        like(products.material, searchTerm)
      )
    );
  }

  if (filters.minPrice !== undefined) {
    conditions.push(gte(products.priceCents, filters.minPrice));
  }

  if (filters.maxPrice !== undefined) {
    conditions.push(lte(products.priceCents, filters.maxPrice));
  }

  if (filters.material) {
    conditions.push(like(products.material, `%${filters.material}%`));
  }

  if (filters.featured) {
    conditions.push(eq(products.featured, true));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Count total products matching filters for pagination.
 */
export async function countProducts(filters: ProductFilters = {}): Promise<number> {
  const { db } = getDb();
  const whereClause = buildProductWhereClause(filters);
  let q = db.select({ count: sql<number>`count(*)` }).from(products);
  if (whereClause) {
    q = q.where(whereClause) as typeof q;
  }
  const [res] = await q;
  return Number(res?.count || 0);
}

/**
 * List products with optional filtering, sorting and pagination.
 * Returns products with their category and variants.
 */
export async function listProducts(filters: ProductFilters = {}): Promise<ProductWithDetails[]> {
  const { db } = getDb();
  const whereClause = buildProductWhereClause(filters);

  // Pagination
  const page = filters.page || 1;
  const limit = filters.limit || 24;
  const offset = (page - 1) * limit;

  // Build base query
  let baseQuery = db.select().from(products);

  if (whereClause) {
    baseQuery = baseQuery.where(whereClause) as typeof baseQuery;
  }

  // Apply sorting
  if (filters.sort === "price_asc") {
    baseQuery = baseQuery.orderBy(products.priceCents) as typeof baseQuery;
  } else if (filters.sort === "price_desc") {
    baseQuery = baseQuery.orderBy(desc(products.priceCents)) as typeof baseQuery;
  } else {
    // Default: newest first
    baseQuery = baseQuery.orderBy(desc(products.createdAt)) as typeof baseQuery;
  }

  // Apply pagination
  const productsList = await baseQuery.limit(limit).offset(offset);

  if (productsList.length === 0) {
    return [];
  }

  // Get all product IDs and category IDs
  const productIds = productsList.map((p) => p.id);
  const categoryIds = [
    ...new Set(productsList.map((p) => p.categoryId).filter(Boolean)),
  ] as number[];

  // Fetch categories
  const categoriesList =
    categoryIds.length > 0
      ? await db.select().from(categories).where(inArray(categories.id, categoryIds))
      : [];

  const categoriesMap = new Map(categoriesList.map((c) => [c.id, c]));

  // Fetch variants
  const variantsList = await db
    .select()
    .from(productVariants)
    .where(inArray(productVariants.productId, productIds));

  const variantsMap = new Map<number, ProductVariant[]>();
  for (const variant of variantsList) {
    if (!variantsMap.has(variant.productId)) {
      variantsMap.set(variant.productId, []);
    }
    variantsMap.get(variant.productId)!.push(variant);
  }

  // Map to ProductWithDetails
  let results = productsList.map((product) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { variants: _omitVariants, ...productWithoutVariants } = product;
    return {
      ...productWithoutVariants,
      category: product.categoryId ? categoriesMap.get(product.categoryId) || null : null,
      productVariants: variantsMap.get(product.id) || [],
    };
  });

  // Apply filters that depend on variants or category type
  results = results.filter((p) => {
    const variants = p.productVariants;

    // Filter by category type
    if (filters.type && p.category?.type !== filters.type) {
      return false;
    }

    // Filter by stock
    if (filters.inStock && !variants.some((v) => v.stockQuantity > 0)) {
      return false;
    }

    // Filter by colour
    if (
      filters.colour &&
      !variants.some((v) => v.colour?.toLowerCase().includes(filters.colour!.toLowerCase()))
    ) {
      return false;
    }

    // Filter by size
    if (
      filters.size &&
      !variants.some((v) => v.size?.toLowerCase().includes(filters.size!.toLowerCase()))
    ) {
      return false;
    }

    return true;
  });

  return results;
}

/**
 * Get a single product by slug with all its details.
 */
export async function getProductBySlug(slug: string): Promise<ProductWithDetails | null> {
  const { db } = getDb();

  const [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);

  if (!product) {
    return null;
  }

  const category = product.categoryId
    ? (
        await db.select().from(categories).where(eq(categories.id, product.categoryId)).limit(1)
      )[0] || null
    : null;

  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, product.id));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { variants: _omitVariants, ...productWithoutVariants } = product;

  return {
    ...productWithoutVariants,
    category,
    productVariants: variants,
  };
}

/**
 * Get a product by ID (for cart operations).
 */
export async function getProductById(id: number): Promise<Product | null> {
  const { db } = getDb();
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return product || null;
}

/**
 * List all categories, optionally filtered by type.
 */
export async function listCategories(type?: "tile" | "furniture"): Promise<Category[]> {
  const { db } = getDb();

  if (type) {
    return db
      .select()
      .from(categories)
      .where(eq(categories.type, type))
      .orderBy(categories.sortOrder);
  }

  return db.select().from(categories).orderBy(categories.sortOrder);
}

/**
 * Get a category by slug.
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { db } = getDb();
  const [category] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return category || null;
}

/**
 * Get all variants for a product.
 */
export async function getVariantsForProduct(productId: number): Promise<ProductVariant[]> {
  const { db } = getDb();
  return db.select().from(productVariants).where(eq(productVariants.productId, productId));
}

/**
 * Get a single variant by SKU.
 */
export async function getVariantBySku(sku: string): Promise<ProductVariant | null> {
  const { db } = getDb();
  const [variant] = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.sku, sku))
    .limit(1);
  return variant || null;
}

/**
 * Format price from cents to dollars.
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
