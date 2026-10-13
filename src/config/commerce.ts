/**
 * commerce.ts — Single source of truth for all commerce constants.
 * Import this file anywhere instead of hard-coding values inline.
 */

// ---------------------------------------------------------------------------
// Currency
// ---------------------------------------------------------------------------
export const DEFAULT_CURRENCY = "USD" as const;
export const CURRENCY_SYMBOL = "$" as const;

// ---------------------------------------------------------------------------
// Tax
// ---------------------------------------------------------------------------
/** US sales-tax rate applied at checkout (8 %). */
export const DEFAULT_TAX_RATE = 0.08;

// ---------------------------------------------------------------------------
// Shipping
// ---------------------------------------------------------------------------
export const SHIPPING_OPTIONS = [
  { id: "standard", label: "Standard (5–7 days)", cents: 0 },
  { id: "express", label: "Express (2–3 days)", cents: 2500 },
  { id: "overnight", label: "Overnight (next day)", cents: 4500 },
] as const;

export type ShippingOptionId = (typeof SHIPPING_OPTIONS)[number]["id"];

export function shippingCentsForMethod(method: ShippingOptionId): number {
  const opt = SHIPPING_OPTIONS.find((o) => o.id === method);
  return opt?.cents ?? 0;
}

// ---------------------------------------------------------------------------
// Order number
// ---------------------------------------------------------------------------
export const ORDER_PREFIX = "CLAY" as const;
/** Max attempts before giving up on a unique order number collision. */
export const ORDER_NUMBER_MAX_RETRIES = 10;

// ---------------------------------------------------------------------------
// Tile calculator defaults
// ---------------------------------------------------------------------------
/** Percentage of extra tiles to order for cuts/wastage. */
export const TILE_WASTAGE_PERCENT = 0.1;
/** Minimum extra boxes to add regardless of size (safety margin). */
export const TILE_MIN_EXTRA_BOXES = 1;

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------
/** Set via PAYMENT_PROVIDER env var. Only "mock" and "stripe" are supported. */
export const SUPPORTED_PAYMENT_PROVIDERS = ["mock", "stripe"] as const;
export type PaymentProvider = (typeof SUPPORTED_PAYMENT_PROVIDERS)[number];

// ---------------------------------------------------------------------------
// Tile Samples
// ---------------------------------------------------------------------------
/** Fixed nominal price for an individual cut tile sample swatch in cents ($5.00). */
export const SAMPLE_SWATCH_PRICE_CENTS = 500;
/** Maximum sample swatches allowed in a single order. */
export const MAX_SAMPLES_PER_ORDER = 5;
/** Standard cut dimension for sample swatches. */
export const SAMPLE_SWATCH_SIZE_LABEL = "10×10 cm Cut Swatch";
/** Promo voucher credit awarded per sample kit order toward full crate orders ($25.00). */
export const SAMPLE_VOUCHER_CREDIT_CENTS = 2500;
