import { test, expect } from "@playwright/test";

test.describe("Health & Baseline E2E Check", () => {
  test("GET /api/health returns healthy status", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe("healthy");
  });
});
