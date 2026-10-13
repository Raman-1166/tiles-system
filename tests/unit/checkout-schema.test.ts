import { describe, it, expect } from "vitest";
import {
  contactSchema,
  addressSchema,
  shippingSchema,
  checkoutSchema,
} from "@/lib/checkout-schema";

describe("Checkout Validation Schemas (src/lib/checkout-schema.ts)", () => {
  it("validates valid contact data", () => {
    const valid = {
      name: "Marcus Aurelius",
      email: "marcus@rome.org",
      phone: "+1 555-0199",
    };
    const result = contactSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects invalid contact data (short name, invalid email)", () => {
    const invalid = {
      name: "M",
      email: "not-an-email",
    };
    const result = contactSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errs = result.error.flatten().fieldErrors;
      expect(errs.name).toBeDefined();
      expect(errs.email).toBeDefined();
    }
  });

  it("validates valid delivery address", () => {
    const valid = {
      line1: "123 Artisan Row",
      city: "Stoke-on-Trent",
      region: "Staffordshire",
      postalCode: "ST1 4DY",
      country: "UK",
    };
    const result = addressSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects missing mandatory address fields", () => {
    const invalid = {
      line1: "12",
      city: "",
      region: "",
      postalCode: "",
    };
    const result = addressSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("validates shipping methods", () => {
    expect(shippingSchema.safeParse({ shippingMethod: "standard" }).success).toBe(true);
    expect(shippingSchema.safeParse({ shippingMethod: "express" }).success).toBe(true);
    expect(shippingSchema.safeParse({ shippingMethod: "drone" }).success).toBe(false);
  });

  it("validates full merged checkout payload", () => {
    const full = {
      name: "John Doe",
      email: "john@example.com",
      line1: "742 Evergreen Terrace",
      city: "Springfield",
      region: "OR",
      postalCode: "97477",
      country: "US",
      shippingMethod: "standard",
    };
    const result = checkoutSchema.safeParse(full);
    expect(result.success).toBe(true);
  });
});
