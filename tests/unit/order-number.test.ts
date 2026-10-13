import { describe, it, expect } from "vitest";
import {
  generateOrderNumber,
  isValidOrderNumber,
  generateUniqueOrderNumber,
} from "@/lib/order-number";

describe("Order Number Generator", () => {
  it("generates order numbers starting with CLAY- and 8 characters", () => {
    const orderNumber = generateOrderNumber();
    expect(orderNumber).toMatch(/^CLAY-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}$/);
    expect(isValidOrderNumber(orderNumber)).toBe(true);
  });

  it("does not generate ambiguous characters (0, O, 1, I, L, U)", () => {
    for (let i = 0; i < 50; i++) {
      const num = generateOrderNumber();
      const randomCode = num.split("-")[1];
      expect(randomCode).not.toMatch(/[0O1ILU]/);
    }
  });

  it("rejects invalid or malformed order numbers", () => {
    expect(isValidOrderNumber("")).toBe(false);
    expect(isValidOrderNumber("CLAY-123")).toBe(false);
    expect(isValidOrderNumber("ORDER-ABCDEFGH")).toBe(false);
    expect(isValidOrderNumber("CLAY-00000000")).toBe(false); // contains 0
    expect(isValidOrderNumber("CLAY-IIIIIIII")).toBe(false); // contains I
  });

  it("retries on collisions and returns first unique order number", async () => {
    let callCount = 0;
    const orderNumber = await generateUniqueOrderNumber(async () => {
      callCount++;
      return callCount < 3; // Collides 2 times, passes on 3rd
    });

    expect(callCount).toBe(3);
    expect(isValidOrderNumber(orderNumber)).toBe(true);
  });

  it("throws if max retries exceeded on continuous collisions", async () => {
    await expect(generateUniqueOrderNumber(async () => true, 3)).rejects.toThrow(
      "Failed to generate a unique order number"
    );
  });
});
