/**
 * accessories.ts — Installation companion products and coverage calculations.
 *
 * For artisanal tile projects, standard architectural guidelines recommend:
 * - Polymer-modified thinset adhesive: 1 bag (20kg) covers ~4.5 m² (approx 48 sq ft).
 * - Architectural color-matched grout: 1 bag (5kg) covers ~10 m² (for 2mm-3mm joints).
 * - Precision anti-lippage leveling spacers & wedges kit: 1 kit (100 pcs) per 10 m².
 */

export interface AccessoryRecommendation {
  id: string;
  productId: number;
  variantId?: number;
  productSlug: string;
  name: string;
  category: string;
  specification: string;
  unitPriceCents: number;
  recommendedQuantity: number;
  totalPriceCents: number;
  coverageFormulaLabel: string;
  badge: string;
}

export const ACCESSORY_PRODUCTS = {
  adhesive: {
    productId: 10,
    variantId: 11, // 20kg
    slug: "premium-tile-adhesive",
    name: "Premium Tile Adhesive",
    size: "20kg Bag",
    priceCents: 3200,
    sqmPerUnit: 4.5,
  },
  grout: {
    productId: 11,
    variantId: 14, // Light Grey
    slug: "epoxy-tile-grout",
    name: "Epoxy Tile Grout",
    size: "5kg Container",
    priceCents: 5900,
    sqmPerUnit: 10.0,
  },
  spacers: {
    productId: 12,
    variantId: 16, // Leveling kit
    slug: "tile-leveling-spacers",
    name: "Tile Leveling System Spacers",
    size: "Kit (100 Clips & Wedges)",
    priceCents: 4200,
    sqmPerUnit: 10.0,
  },
} as const;

/**
 * Calculates recommended companion supplies based on total tile gross square metres.
 * @param grossAreaSqm Gross surface area including wastage
 */
export function calculateAccessories(grossAreaSqm: number): AccessoryRecommendation[] {
  if (grossAreaSqm <= 0) return [];

  const adhesiveQty = Math.max(1, Math.ceil(grossAreaSqm / ACCESSORY_PRODUCTS.adhesive.sqmPerUnit));
  const groutQty = Math.max(1, Math.ceil(grossAreaSqm / ACCESSORY_PRODUCTS.grout.sqmPerUnit));
  const spacersQty = Math.max(1, Math.ceil(grossAreaSqm / ACCESSORY_PRODUCTS.spacers.sqmPerUnit));

  return [
    {
      id: "rec-adhesive",
      productId: ACCESSORY_PRODUCTS.adhesive.productId,
      variantId: ACCESSORY_PRODUCTS.adhesive.variantId,
      productSlug: ACCESSORY_PRODUCTS.adhesive.slug,
      name: ACCESSORY_PRODUCTS.adhesive.name,
      category: "Adhesives & Mortar",
      specification: ACCESSORY_PRODUCTS.adhesive.size,
      unitPriceCents: ACCESSORY_PRODUCTS.adhesive.priceCents,
      recommendedQuantity: adhesiveQty,
      totalPriceCents: adhesiveQty * ACCESSORY_PRODUCTS.adhesive.priceCents,
      coverageFormulaLabel: `1 × 20kg bag per ~4.5 m² (${grossAreaSqm.toFixed(1)} m² required)`,
      badge: "Essential",
    },
    {
      id: "rec-grout",
      productId: ACCESSORY_PRODUCTS.grout.productId,
      variantId: ACCESSORY_PRODUCTS.grout.variantId,
      productSlug: ACCESSORY_PRODUCTS.grout.slug,
      name: ACCESSORY_PRODUCTS.grout.name,
      category: "Grout & Joints",
      specification: ACCESSORY_PRODUCTS.grout.size,
      unitPriceCents: ACCESSORY_PRODUCTS.grout.priceCents,
      recommendedQuantity: groutQty,
      totalPriceCents: groutQty * ACCESSORY_PRODUCTS.grout.priceCents,
      coverageFormulaLabel: `1 × 5kg unit per ~10 m² for 2-3mm grout joints`,
      badge: "Recommended",
    },
    {
      id: "rec-spacers",
      productId: ACCESSORY_PRODUCTS.spacers.productId,
      variantId: ACCESSORY_PRODUCTS.spacers.variantId,
      productSlug: ACCESSORY_PRODUCTS.spacers.slug,
      name: ACCESSORY_PRODUCTS.spacers.name,
      category: "Tools & Leveling",
      specification: ACCESSORY_PRODUCTS.spacers.size,
      unitPriceCents: ACCESSORY_PRODUCTS.spacers.priceCents,
      recommendedQuantity: spacersQty,
      totalPriceCents: spacersQty * ACCESSORY_PRODUCTS.spacers.priceCents,
      coverageFormulaLabel: `1 kit per 10 m² to prevent tile lippage on walls/floors`,
      badge: "Pro Finish",
    },
  ];
}
