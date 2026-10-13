import { describe, it, expect } from "vitest";
import { calculateAccessories, ACCESSORY_PRODUCTS } from "@/config/accessories";

describe("Accessories Recommendation Engine (Task 4.3)", () => {
  it("returns empty array for zero or negative area", () => {
    expect(calculateAccessories(0)).toEqual([]);
    expect(calculateAccessories(-5)).toEqual([]);
  });

  it("calculates minimum 1 unit for small room (3 m²)", () => {
    const recs = calculateAccessories(3.0);
    expect(recs).toHaveLength(3);

    const adhesive = recs.find((r) => r.id === "rec-adhesive");
    const grout = recs.find((r) => r.id === "rec-grout");
    const spacers = recs.find((r) => r.id === "rec-spacers");

    expect(adhesive?.recommendedQuantity).toBe(1);
    expect(grout?.recommendedQuantity).toBe(1);
    expect(spacers?.recommendedQuantity).toBe(1);

    expect(adhesive?.totalPriceCents).toBe(ACCESSORY_PRODUCTS.adhesive.priceCents);
    expect(grout?.totalPriceCents).toBe(ACCESSORY_PRODUCTS.grout.priceCents);
    expect(spacers?.totalPriceCents).toBe(ACCESSORY_PRODUCTS.spacers.priceCents);
  });

  it("scales accessory quantities appropriately for a large room (25 m²)", () => {
    // 25 m² / 4.5 = 5.55 -> 6 bags adhesive
    // 25 m² / 10 = 2.5 -> 3 bags grout
    // 25 m² / 10 = 2.5 -> 3 spacer kits
    const recs = calculateAccessories(25.0);

    const adhesive = recs.find((r) => r.id === "rec-adhesive");
    const grout = recs.find((r) => r.id === "rec-grout");
    const spacers = recs.find((r) => r.id === "rec-spacers");

    expect(adhesive?.recommendedQuantity).toBe(6);
    expect(grout?.recommendedQuantity).toBe(3);
    expect(spacers?.recommendedQuantity).toBe(3);

    expect(adhesive?.totalPriceCents).toBe(6 * 3200);
    expect(grout?.totalPriceCents).toBe(3 * 5900);
    expect(spacers?.totalPriceCents).toBe(3 * 4200);
  });
});
