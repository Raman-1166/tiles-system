import { describe, it, expect } from "vitest";
import dotenv from "dotenv";
import { AdminProductService } from "@/services/admin-products.service";

dotenv.config();

describe("AdminProductService (Task 5.2)", () => {
  it("lists products and categories for admin inventory control", async () => {
    const result = await AdminProductService.listProducts({ limit: 5 });
    expect(result).toHaveProperty("products");
    expect(result).toHaveProperty("categories");
    expect(Array.isArray(result.products)).toBe(true);
    expect(Array.isArray(result.categories)).toBe(true);

    if (result.products.length > 0) {
      const first = result.products[0];
      expect(first).toHaveProperty("productVariants");
      expect(first).toHaveProperty("totalStock");
    }
  });

  it("fails to find non-existent product with AppError 404", async () => {
    await expect(AdminProductService.getProductById(999999)).rejects.toThrow("Product not found");
  });
});
