import { describe, it, expect } from "vitest";
import dotenv from "dotenv";
import { signCustomerSession, verifyCustomerSession } from "@/lib/customer-session";
import { CustomerService } from "@/services/customer.service";

dotenv.config();

describe("Customer Authentication & Session (Task 5.3)", () => {
  it("signs and verifies customer session tokens securely", () => {
    const token = signCustomerSession(42, "test@clayandco.com");
    expect(typeof token).toBe("string");
    expect(token).toContain("42:test@clayandco.com:");

    const verified = verifyCustomerSession(token);
    expect(verified).not.toBeNull();
    expect(verified?.customerId).toBe(42);
    expect(verified?.email).toBe("test@clayandco.com");
  });

  it("rejects tampered customer session tokens", () => {
    const token = signCustomerSession(42, "test@clayandco.com");
    const tampered = token.replace("42:", "99:");
    expect(verifyCustomerSession(tampered)).toBeNull();
  });

  it("validates registration input requirements", async () => {
    await expect(
      CustomerService.register({
        email: "invalid-email",
        password: "short",
        name: "",
      })
    ).rejects.toThrow();
  });
});
