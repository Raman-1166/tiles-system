import { describe, it, expect } from "vitest";
import { createOrderToken, verifyOrderToken } from "@/lib/order-token";

describe("Order Access Token (HMAC Signed)", () => {
  it("creates and verifies a valid token for an order number", () => {
    const orderNumber = "CLAY-4K8P2N9W";
    const token = createOrderToken(orderNumber);

    const result = verifyOrderToken(token);
    expect(result.valid).toBe(true);
    expect(result.orderNumber).toBe(orderNumber);
    expect(result.expired).toBe(false);
  });

  it("detects expired tokens", () => {
    const orderNumber = "CLAY-9X2M7P5T";
    // Create token that expired 1 second ago (-1000ms)
    const token = createOrderToken(orderNumber, -1000);

    const result = verifyOrderToken(token);
    expect(result.valid).toBe(false);
    expect(result.expired).toBe(true);
    expect(result.orderNumber).toBe(orderNumber);
  });

  it("rejects tampered tokens with invalid signature", () => {
    const orderNumber = "CLAY-4K8P2N9W";
    const token = createOrderToken(orderNumber);
    const tampered = token.replace(/^[^\.]+/, "CLAY-ATTACKER");

    const result = verifyOrderToken(tampered);
    expect(result.valid).toBe(false);
  });

  it("rejects garbage strings and empty tokens", () => {
    expect(verifyOrderToken("").valid).toBe(false);
    expect(verifyOrderToken("invalid.token").valid).toBe(false);
    expect(verifyOrderToken("a.b.c").valid).toBe(false);
  });
});
