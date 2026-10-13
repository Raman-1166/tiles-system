import { describe, it, expect } from "vitest";
import { CartService } from "@/services/cart.service";
import {
  SAMPLE_SWATCH_PRICE_CENTS,
  MAX_SAMPLES_PER_ORDER,
  SAMPLE_SWATCH_SIZE_LABEL,
  SAMPLE_VOUCHER_CREDIT_CENTS,
} from "@/config/commerce";
import type { CartLine } from "@/lib/cart";

describe("Tile Sample Swatch Flow (Task 4.1)", () => {
  it("exports sensible sample swatch configuration constants", () => {
    expect(SAMPLE_SWATCH_PRICE_CENTS).toBe(500); // $5.00
    expect(MAX_SAMPLES_PER_ORDER).toBe(5);
    expect(SAMPLE_SWATCH_SIZE_LABEL).toContain("10×10");
    expect(SAMPLE_VOUCHER_CREDIT_CENTS).toBe(2500); // $25.00
  });

  it("prices sample lines at fixed sample price instead of box price in CartService totals", () => {
    const regularLine: CartLine = {
      id: 1,
      sessionId: "test-session",
      productId: 1,
      variantId: 10,
      quantity: 2,
      variant: "Natural",
      meta: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      product: {
        id: 1,
        name: "Cotto Terracotta Tile",
        slug: "cotto-terracotta-tile",
        priceCents: 8500, // $85.00 per box
        unit: "box",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    };

    const sampleLine: CartLine = {
      id: 2,
      sessionId: "test-session",
      productId: 1,
      variantId: 10,
      quantity: 1,
      variant: "Natural",
      meta: { isSample: true, swatchSize: SAMPLE_SWATCH_SIZE_LABEL },
      createdAt: new Date(),
      updatedAt: new Date(),
      product: {
        id: 1,
        name: "Cotto Terracotta Tile",
        slug: "cotto-terracotta-tile",
        priceCents: 8500, // $85.00 regular price
        unit: "box",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    };

    const totals = CartService.calculateTotals([regularLine, sampleLine]);

    // Regular: 2 * 8500 = 17000 ($170.00)
    // Sample: 1 * 500 = 500 ($5.00)
    // Subtotal: 17500 ($175.00)
    expect(totals.subtotalCents).toBe(17500);
    expect(totals.itemCount).toBe(3);
    expect(totals.linesCount).toBe(2);
  });

  it("calculates totals correctly when cart contains only sample swatches", () => {
    const sampleLine1: CartLine = {
      id: 101,
      sessionId: "test-session",
      productId: 1,
      variantId: null,
      quantity: 2,
      variant: null,
      meta: { isSample: true },
      createdAt: new Date(),
      updatedAt: new Date(),
      product: {
        id: 1,
        name: "Zellige Glazed Tile",
        slug: "zellige-glazed-tile",
        priceCents: 12000,
        unit: "box",
      } as any,
    };

    const sampleLine2: CartLine = {
      id: 102,
      sessionId: "test-session",
      productId: 2,
      variantId: null,
      quantity: 1,
      variant: null,
      meta: { isSample: true },
      createdAt: new Date(),
      updatedAt: new Date(),
      product: {
        id: 2,
        name: "Limestone Tile",
        slug: "limestone-tile",
        priceCents: 9500,
        unit: "box",
      } as any,
    };

    const totals = CartService.calculateTotals([sampleLine1, sampleLine2]);

    // 3 samples * $5.00 = $15.00 = 1500 cents
    expect(totals.subtotalCents).toBe(1500);
    expect(totals.itemCount).toBe(3);
  });
});
