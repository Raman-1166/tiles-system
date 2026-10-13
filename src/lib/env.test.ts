import { describe, it, expect } from "vitest";
import { validateEnv } from "./env";

describe("Environment Validation (src/lib/env.ts)", () => {
  const validBase = {
    NODE_ENV: "development",
    DATABASE_URL: "mysql://root:root@localhost:3306/app_db",
    ADMIN_PASSWORD: "secure_password_123",
    ADMIN_SESSION_SECRET: "12345678901234567890123456789012", // 32 chars
    ORDER_TOKEN_SECRET: "abcdefabcdefabcdefabcdefabcdefab", // 32 chars
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    PAYMENT_PROVIDER: "mock",
  };

  it("succeeds when all required environment variables are present and valid", () => {
    const parsed = validateEnv(validBase);
    expect(parsed.DATABASE_URL).toBe(validBase.DATABASE_URL);
    expect(parsed.PAYMENT_PROVIDER).toBe("mock");
  });

  it("fails if DATABASE_URL is missing", () => {
    const invalid = { ...validBase, DATABASE_URL: "" };
    expect(() => validateEnv(invalid)).toThrow("DATABASE_URL is required");
  });

  it("fails if ADMIN_SESSION_SECRET is less than 32 characters", () => {
    const invalid = { ...validBase, ADMIN_SESSION_SECRET: "too-short" };
    expect(() => validateEnv(invalid)).toThrow(
      "ADMIN_SESSION_SECRET must be at least 32 characters long"
    );
  });

  it("fails if ORDER_TOKEN_SECRET is less than 32 characters", () => {
    const invalid = { ...validBase, ORDER_TOKEN_SECRET: "short-token" };
    expect(() => validateEnv(invalid)).toThrow(
      "ORDER_TOKEN_SECRET must be at least 32 characters long"
    );
  });

  it("fails if PAYMENT_PROVIDER is 'mock' in production", () => {
    const invalid = {
      ...validBase,
      NODE_ENV: "production",
      PAYMENT_PROVIDER: "mock",
    };
    expect(() => validateEnv(invalid)).toThrow("PAYMENT_PROVIDER cannot be 'mock' in production");
  });

  it("requires STRIPE_SECRET_KEY when PAYMENT_PROVIDER is 'stripe'", () => {
    const invalid = {
      ...validBase,
      PAYMENT_PROVIDER: "stripe",
    };
    expect(() => validateEnv(invalid)).toThrow("STRIPE_SECRET_KEY is required");
  });
});
