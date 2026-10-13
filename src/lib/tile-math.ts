/**
 * tile-math.ts — Pure geometric, area, coverage and wastage calculations.
 *
 * Used by PDP tile calculator, 3D room visualizer, cart line calculations,
 * and order fulfillment checks.
 */

export type TileLayoutType = "straight" | "herringbone" | "brick" | "diagonal" | "chevron";

/** Conversion constant: 1 square metre = 10.763910416709722 square feet */
export const SQM_TO_SQFT_FACTOR = 10.763910416709722;

/**
 * Standard wastage percentages recommended by tile industry standards:
 * - Straight / Stacked bond: 10% (minimal cuts)
 * - Brick / Running bond: 10%
 * - Herringbone: 15% (45° angle cuts require significant edge trimming)
 * - Diagonal / Chevron: 15%
 */
export const LAYOUT_WASTAGE_PERCENTAGES: Record<TileLayoutType, number> = {
  straight: 0.1,
  brick: 0.1,
  herringbone: 0.15,
  diagonal: 0.15,
  chevron: 0.15,
};

/**
 * Default fallback wastage (10%).
 */
export const DEFAULT_WASTAGE_PERCENTAGE = 0.1;

/**
 * Get wastage multiplier for a given tile layout pattern.
 * E.g., 'straight' -> 0.10, 'herringbone' -> 0.15.
 */
export function getWastageRate(layout?: string | null): number {
  if (!layout) return DEFAULT_WASTAGE_PERCENTAGE;
  const normalized = layout.toLowerCase().trim() as TileLayoutType;
  return LAYOUT_WASTAGE_PERCENTAGES[normalized] ?? DEFAULT_WASTAGE_PERCENTAGE;
}

/**
 * Convert square metres to square feet.
 */
export function sqmToSqft(sqm: number): number {
  if (sqm < 0) return 0;
  return Number((sqm * SQM_TO_SQFT_FACTOR).toFixed(2));
}

/**
 * Convert square feet to square metres.
 */
export function sqftToSqm(sqft: number): number {
  if (sqft < 0) return 0;
  return Number((sqft / SQM_TO_SQFT_FACTOR).toFixed(4));
}

/**
 * Convert centimetres to metres.
 */
export function cmToM(cm: number): number {
  if (cm <= 0) return 0;
  return cm / 100;
}

/**
 * Calculate net area in square metres from dimensions in metres.
 */
export function calculateNetAreaSqm(widthM: number, lengthM: number): number {
  if (widthM <= 0 || lengthM <= 0) return 0;
  return Number((widthM * lengthM).toFixed(4));
}

/**
 * Calculate required gross area including wastage.
 * @param netAreaSqm Net room or wall surface area in m²
 * @param layout Layout pattern ("straight", "herringbone", "brick", etc.)
 * @param customWastage Optional explicit wastage rate (0.10 = 10%)
 */
export function calculateGrossAreaSqm(
  netAreaSqm: number,
  layout?: string | null,
  customWastage?: number
): number {
  if (netAreaSqm <= 0) return 0;
  const wastage = typeof customWastage === "number" ? customWastage : getWastageRate(layout);
  return Number((netAreaSqm * (1 + wastage)).toFixed(4));
}

export interface BoxCalculationResult {
  netAreaSqm: number;
  grossAreaSqm: number;
  wastagePercent: number;
  coveragePerBoxSqm: number;
  boxesNeeded: number;
  totalDeliveredAreaSqm: number;
  extraAreaSqm: number;
}

/**
 * Calculate full boxes of tiles needed to cover an area safely.
 * Always rounds up (ceil) to full boxes because tiles are sold by the box.
 */
export function calculateBoxesNeeded(
  netAreaSqm: number,
  coveragePerBoxSqm: number,
  layout?: string | null,
  customWastage?: number
): BoxCalculationResult {
  if (netAreaSqm <= 0 || coveragePerBoxSqm <= 0) {
    return {
      netAreaSqm: 0,
      grossAreaSqm: 0,
      wastagePercent: 0,
      coveragePerBoxSqm: coveragePerBoxSqm > 0 ? coveragePerBoxSqm : 0,
      boxesNeeded: 0,
      totalDeliveredAreaSqm: 0,
      extraAreaSqm: 0,
    };
  }

  const wastageRate = typeof customWastage === "number" ? customWastage : getWastageRate(layout);
  const grossAreaSqm = calculateGrossAreaSqm(netAreaSqm, layout, wastageRate);
  const boxesNeeded = Math.ceil(grossAreaSqm / coveragePerBoxSqm);
  const totalDeliveredAreaSqm = Number((boxesNeeded * coveragePerBoxSqm).toFixed(4));
  const extraAreaSqm = Number(Math.max(0, totalDeliveredAreaSqm - netAreaSqm).toFixed(4));

  return {
    netAreaSqm,
    grossAreaSqm,
    wastagePercent: Math.round(wastageRate * 100),
    coveragePerBoxSqm,
    boxesNeeded,
    totalDeliveredAreaSqm,
    extraAreaSqm,
  };
}

/**
 * Convert price per m² (integer cents) to price per sq ft (integer cents).
 */
export function pricePerM2ToSqft(pricePerM2Cents: number): number {
  if (pricePerM2Cents <= 0) return 0;
  return Math.round(pricePerM2Cents / SQM_TO_SQFT_FACTOR);
}

/**
 * Convert price per sq ft (integer cents) to price per m² (integer cents).
 */
export function pricePerSqftToM2(pricePerSqftCents: number): number {
  if (pricePerSqftCents <= 0) return 0;
  return Math.round(pricePerSqftCents * SQM_TO_SQFT_FACTOR);
}
