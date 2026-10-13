import { describe, it, expect } from "vitest";

describe("Baseline Environment Safety", () => {
  it("enforces Node.js >= 20", () => {
    const major = parseInt(process.versions.node.split(".")[0], 10);
    expect(major).toBeGreaterThanOrEqual(20);
  });

  it("verifies vitest test runner is active", () => {
    expect(true).toBe(true);
  });
});
