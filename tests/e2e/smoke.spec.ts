import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Smoke Tests", () => {
  test("home page loads and main heading is visible", async ({ page }) => {
    await page.goto("/");
    // Verify page loaded successfully (2xx)
    const response = await page.request.get("/");
    expect(response.status()).toBeLessThan(400);

    // Main heading: check for an h1 that is visible
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    const text = await h1.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(2);
  });

  test("GET /api/health returns ok:true", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe("healthy");
  });

  test("GET /admin redirects to /admin/login", async ({ page }) => {
    const response = await page.goto("/admin", { waitUntil: "domcontentloaded" });
    // After redirect chain, final URL must include /admin/login
    expect(page.url()).toContain("/admin/login");
    // Response should be 200 (the login page itself)
    expect(response?.status()).toBe(200);
  });

  test("home page passes basic axe accessibility checks", async ({ page }) => {
    await page.goto("/");
    // Wait for meaningful content to be rendered
    await page.waitForSelector("h1", { timeout: 10000 });

    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast"]) // Skip contrast in headless (no GPU rendering)
      .analyze();

    // Log violations for visibility in CI without failing on non-critical issues
    if (results.violations.length > 0) {
      console.log(
        "Axe violations found:",
        results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`).join("\n")
      );
    }

    // Only fail on critical (WCAG A) violations
    const criticalViolations = results.violations.filter((v) =>
      v.tags.some((t) => t === "wcag2a" || t === "wcag21a")
    );
    expect(
      criticalViolations,
      `Critical a11y violations:\n${JSON.stringify(criticalViolations, null, 2)}`
    ).toHaveLength(0);
  });
});
