// Re-export query functions for backward compatibility
export {
  listProducts,
  getProductBySlug,
  getProductById,
  listCategories,
  getCategoryBySlug,
  getVariantsForProduct,
  getVariantBySku,
  formatPrice,
  type ProductWithDetails,
  type ProductFilters,
} from "@/db/queries";
