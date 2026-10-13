import { describe, it, expect } from "vitest";
import { MemoryRateLimitStore } from "@/lib/rate-limit";

describe("Rate Limiter (Sliding Window)", () => {
  it("permits requests within the window limit and tracks remaining quota", () => {
    const store = new MemoryRateLimitStore();
    const key = "test-client";
    const max = 3;
    const intervalMs = 1000;

    const r1 = store.consume(key, max, intervalMs);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = store.consume(key, max, intervalMs);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = store.consume(key, max, intervalMs);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);

    // 4th request exceeds max
    const r4 = store.consume(key, max, intervalMs);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
    expect(r4.resetMs).toBeGreaterThan(0);
  });

  it("resets limits when key is cleared", () => {
    const store = new MemoryRateLimitStore();
    const key = "test-reset";

    store.consume(key, 1, 1000);
    const blocked = store.consume(key, 1, 1000);
    expect(blocked.allowed).toBe(false);

    store.reset(key);
    const allowed = store.consume(key, 1, 1000);
    expect(allowed.allowed).toBe(true);
  });
});
