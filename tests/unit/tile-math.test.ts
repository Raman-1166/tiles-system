import { describe, it, expect } from "vitest";
import {
  sqmToSqft,
  sqftToSqm,
  cmToM,
  calculateNetAreaSqm,
  calculateGrossAreaSqm,
  calculateBoxesNeeded,
  pricePerM2ToSqft,
  pricePerSqftToM2,
  getWastageRate,
} from "@/lib/tile-math";

describe("Tile Math Library", () => {
  it("converts square metres to square feet and back accurately", () => {
    // 1 m² = ~10.76 sq ft
    expect(sqmToSqft(1)).toBe(10.76);
    expect(sqmToSqft(10)).toBe(107.64);
    expect(sqmToSqft(0)).toBe(0);
    expect(sqmToSqft(-5)).toBe(0);

    // 10.7639 sq ft = 1 m²
    expect(sqftToSqm(10.7639)).toBe(1.0);
    expect(sqftToSqm(0)).toBe(0);
  });

  it("converts cm to metres", () => {
    expect(cmToM(60)).toBe(0.6);
    expect(cmToM(120)).toBe(1.2);
    expect(cmToM(0)).toBe(0);
    expect(cmToM(-10)).toBe(0);
  });

  it("calculates net surface area", () => {
    expect(calculateNetAreaSqm(3.5, 4.0)).toBe(14.0);
    expect(calculateNetAreaSqm(0, 5)).toBe(0);
    expect(calculateNetAreaSqm(-2, 5)).toBe(0);
  });

  it("returns layout-specific wastage factors", () => {
    expect(getWastageRate("straight")).toBe(0.1);
    expect(getWastageRate("brick")).toBe(0.1);
    expect(getWastageRate("herringbone")).toBe(0.15);
    expect(getWastageRate("diagonal")).toBe(0.15);
    expect(getWastageRate("chevron")).toBe(0.15);
    expect(getWastageRate(null)).toBe(0.1);
  });

  it("calculates gross area with layout wastage", () => {
    // 10 m² straight layout (10% extra) = 11 m²
    expect(calculateGrossAreaSqm(10, "straight")).toBe(11.0);
    // 10 m² herringbone layout (15% extra) = 11.5 m²
    expect(calculateGrossAreaSqm(10, "herringbone")).toBe(11.5);
    // Zero area yields zero
    expect(calculateGrossAreaSqm(0, "herringbone")).toBe(0);
  });

  it("calculates boxes needed with ceiling rounding", () => {
    // Net: 10 m², Straight layout (+10% -> 11 m² gross).
    // Box coverage: 1.44 m² per box.
    // 11 / 1.44 = 7.638 -> 8 boxes.
    const res = calculateBoxesNeeded(10, 1.44, "straight");
    expect(res.netAreaSqm).toBe(10);
    expect(res.grossAreaSqm).toBe(11);
    expect(res.wastagePercent).toBe(10);
    expect(res.boxesNeeded).toBe(8);
    expect(res.totalDeliveredAreaSqm).toBe(11.52);
    expect(res.extraAreaSqm).toBe(1.52);
  });

  it("handles herringbone layout requiring extra boxes", () => {
    // Net: 10 m², Herringbone (+15% -> 11.5 m² gross).
    // Box coverage: 1.44 m².
    // 11.5 / 1.44 = 7.986 -> 8 boxes.
    const res = calculateBoxesNeeded(10, 1.44, "herringbone");
    expect(res.wastagePercent).toBe(15);
    expect(res.grossAreaSqm).toBe(11.5);
    expect(res.boxesNeeded).toBe(8);
  });

  it("handles zero and invalid inputs gracefully", () => {
    const resZero = calculateBoxesNeeded(0, 1.44);
    expect(resZero.boxesNeeded).toBe(0);

    const resNegative = calculateBoxesNeeded(-10, 1.44);
    expect(resNegative.boxesNeeded).toBe(0);

    const resZeroBox = calculateBoxesNeeded(10, 0);
    expect(resZeroBox.boxesNeeded).toBe(0);
  });

  it("converts price per m² to price per sq ft and back", () => {
    // $45.00/m² (4500 cents) -> 4500 / 10.7639 ≈ 418 cents ($4.18/sq ft)
    expect(pricePerM2ToSqft(4500)).toBe(418);
    expect(pricePerSqftToM2(418)).toBe(4499);
    expect(pricePerM2ToSqft(0)).toBe(0);
  });
});
