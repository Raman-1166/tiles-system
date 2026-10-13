/**
 * money.ts — Deterministic, integer-only money arithmetic.
 *
 * All prices are stored as integer cents to avoid floating-point rounding.
 * Never use floating-point arithmetic for money.
 */

import { DEFAULT_CURRENCY, CURRENCY_SYMBOL, DEFAULT_TAX_RATE } from "@/config/commerce";

// ---------------------------------------------------------------------------
// Core formatting
// ---------------------------------------------------------------------------

/**
 * Format an integer cent amount as a human-readable currency string.
 * @example formatMoney(4999) → "$49.99"
 * @example formatMoney(4999, "GBP") → "£49.99"
 */
export function formatMoney(
  cents: number,
  currency: string = DEFAULT_CURRENCY,
  locale = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Format cents as a compact string without Intl (safe in any context).
 * @example formatMoneySimple(4999) → "$49.99"
 */
export function formatMoneySimple(cents: number): string {
  const dollars = Math.floor(cents / 100);
  const remainder = Math.abs(cents % 100)
    .toString()
    .padStart(2, "0");
  return `${CURRENCY_SYMBOL}${dollars}.${remainder}`;
}

// ---------------------------------------------------------------------------
// Arithmetic helpers (all operate in integer cents)
// ---------------------------------------------------------------------------

/**
 * Calculate sales tax in cents, rounded to nearest cent.
 * @example calcTax(10000, 0.08) → 800
 */
export function calcTax(subtotalCents: number, rate: number = DEFAULT_TAX_RATE): number {
  return Math.round(subtotalCents * rate);
}

/**
 * Sum an array of line totals (unitPriceCents × quantity).
 */
export function calcSubtotal(
  lines: ReadonlyArray<{ unitPriceCents: number; quantity: number }>
): number {
  return lines.reduce((acc, line) => acc + line.unitPriceCents * line.quantity, 0);
}

/**
 * Compute order total: subtotal + shipping + tax.
 * All values are integer cents.
 */
export function calcOrderTotal(
  subtotalCents: number,
  shippingCents: number,
  taxCents: number
): number {
  return subtotalCents + shippingCents + taxCents;
}

/**
 * Convert dollars (number) to integer cents.
 * @example dollarsToCents(49.99) → 4999
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert integer cents to decimal dollars.
 * @example centsToDollars(4999) → 49.99
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Apply a percentage discount to an amount (integer cents).
 * Discount percent is 0–100 (e.g. 10 = 10% off).
 * @example applyDiscount(10000, 10) → 9000
 */
export function applyDiscount(cents: number, discountPercent: number): number {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new RangeError(`Discount must be between 0 and 100; got ${discountPercent}`);
  }
  return Math.round(cents * (1 - discountPercent / 100));
}
