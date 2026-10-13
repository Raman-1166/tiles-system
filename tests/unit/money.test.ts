import { describe, it, expect } from "vitest";
import {
  formatMoney,
  formatMoneySimple,
  calcTax,
  calcSubtotal,
  calcOrderTotal,
  dollarsToCents,
  centsToDollars,
  applyDiscount,
} from "@/lib/money";

describe("Money Library (Integer arithmetic & formatting)", () => {
  it("formats integer cents into formatted currency strings", () => {
    expect(formatMoney(4999)).toBe("$49.99");
    expect(formatMoney(0)).toBe("$0.00");
    expect(formatMoney(120000)).toBe("$1,200.00");
    expect(formatMoney(5)).toBe("$0.05");
  });

  it("formats simple currency strings without locale reliance", () => {
    expect(formatMoneySimple(4999)).toBe("$49.99");
    expect(formatMoneySimple(0)).toBe("$0.00");
    expect(formatMoneySimple(85)).toBe("$0.85");
    expect(formatMoneySimple(10050)).toBe("$100.50");
  });

  it("calculates sales tax deterministically using integer rounding", () => {
    // 8% tax on $100.00 (10000 cents) = 800 cents ($8.00)
    expect(calcTax(10000, 0.08)).toBe(800);
    // 8% tax on $29.99 (2999 cents) = 239.92 -> rounds to 240 cents ($2.40)
    expect(calcTax(2999, 0.08)).toBe(240);
    // zero subtotal yields zero tax
    expect(calcTax(0, 0.08)).toBe(0);
  });

  it("calculates line item subtotal across multiple lines", () => {
    const lines = [
      { unitPriceCents: 1500, quantity: 2 }, // 3000
      { unitPriceCents: 4500, quantity: 1 }, // 4500
      { unitPriceCents: 250, quantity: 4 }, // 1000
    ];
    expect(calcSubtotal(lines)).toBe(8500);
  });

  it("computes order total from subtotal, shipping, and tax", () => {
    expect(calcOrderTotal(10000, 2500, 800)).toBe(13300);
    expect(calcOrderTotal(0, 0, 0)).toBe(0);
  });

  it("converts dollars to cents and back without float drift", () => {
    expect(dollarsToCents(49.99)).toBe(4999);
    expect(dollarsToCents(0.01)).toBe(1);
    expect(dollarsToCents(1234.56)).toBe(123456);

    expect(centsToDollars(4999)).toBe(49.99);
    expect(centsToDollars(100)).toBe(1.0);
    expect(centsToDollars(5)).toBe(0.05);
  });

  it("calculates percentage discounts accurately", () => {
    expect(applyDiscount(10000, 10)).toBe(9000); // 10% off $100 -> $90
    expect(applyDiscount(10000, 0)).toBe(10000); // 0% off
    expect(applyDiscount(10000, 100)).toBe(0); // 100% off

    expect(() => applyDiscount(1000, -5)).toThrowError(RangeError);
    expect(() => applyDiscount(1000, 105)).toThrowError(RangeError);
  });
});
