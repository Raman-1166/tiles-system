import { test, expect } from "@playwright/test";

test.describe("Checkout & Order Lifecycle E2E", () => {
  test("guest can add item to cart, checkout, simulate payment, and view order", async ({
    page,
    request,
  }) => {
    // 1. Get an active product variant to purchase
    const productsRes = await request.get("/api/products");
    expect(productsRes.status()).toBe(200);
    const productsData = await productsRes.json();
    expect(productsData.products.length).toBeGreaterThan(0);
    const product = productsData.products[0];
    const variantId = product.variants?.[0]?.id || null;

    // 2. Add product to cart via cart API
    const addCartRes = await request.post("/api/cart", {
      data: {
        productId: product.id,
        variantId: variantId,
        quantity: 1,
      },
    });
    expect(addCartRes.status()).toBe(200);

    // Grab session cookie from response
    const cookies = addCartRes.headers()["set-cookie"] || "";
    const cartCookieMatch = cookies.match(/cart_session=([^;]+)/);
    const cartSessionId = cartCookieMatch ? cartCookieMatch[1] : undefined;

    // 3. Submit checkout
    const idempotencyKey = `e2e_idemp_${Date.now()}`;
    const checkoutHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    };
    if (cartSessionId) {
      checkoutHeaders["Cookie"] = `cart_session=${cartSessionId}`;
    }

    const checkoutRes = await request.post("/api/checkout", {
      headers: checkoutHeaders,
      data: {
        name: "Test Customer",
        email: "test.customer@example.com",
        phone: "+1 (555) 000-1111",
        line1: "123 Main Street",
        city: "San Francisco",
        region: "CA",
        postalCode: "94107",
        country: "US",
        shippingMethod: "standard",
      },
    });

    expect(checkoutRes.status()).toBe(200);
    const checkoutData = await checkoutRes.json();
    expect(checkoutData.ok).toBe(true);
    expect(checkoutData.orderNumber).toMatch(/^CLAY-[A-Z0-9]{8}$/);
    const orderNumber = checkoutData.orderNumber;
    const token = checkoutData.token;

    // 4. Test Idempotency: Re-submitting with identical Idempotency-Key returns same order
    const replayRes = await request.post("/api/checkout", {
      headers: checkoutHeaders,
      data: {
        name: "Test Customer",
        email: "test.customer@example.com",
        line1: "123 Main Street",
        city: "San Francisco",
        region: "CA",
        postalCode: "94107",
        country: "US",
        shippingMethod: "standard",
      },
    });
    expect(replayRes.status()).toBe(200);
    const replayData = await replayRes.json();
    expect(replayData.orderNumber).toBe(orderNumber);

    // 5. Simulate payment via developer endpoint
    const payRes = await request.post("/api/dev/pay", {
      data: { orderNumber },
    });
    expect(payRes.status()).toBe(200);
    const payData = await payRes.json();
    expect(payData.ok).toBe(true);

    // 6. Verify order status has transitioned to paid
    const orderApiRes = await request.get(
      `/api/order/${orderNumber}?token=${encodeURIComponent(token)}`
    );
    expect(orderApiRes.status()).toBe(200);
    const orderApiData = await orderApiRes.json();
    expect(orderApiData.order.orderNumber).toBe(orderNumber);
    expect(orderApiData.order.paymentStatus).toBe("paid");
    expect(orderApiData.order.status).toBe("paid");

    // 7. Verify browser page renders order details
    await page.goto(`/order/${orderNumber}?token=${encodeURIComponent(token)}`);
    await expect(page.locator(`text=${orderNumber}`)).toBeVisible();
    await expect(
      page.locator("text=Payment Confirmed").or(page.locator("text=Paid"))
    ).toBeVisible();

    // 8. Verify customer lookup page works
    const lookupRes = await request.post("/api/order/lookup", {
      data: {
        orderNumber,
        email: "test.customer@example.com",
      },
    });
    expect(lookupRes.status()).toBe(200);
    const lookupData = await lookupRes.json();
    expect(lookupData.order.orderNumber).toBe(orderNumber);
    expect(lookupData.token).toBeTruthy();
  });

  test("rejects order access when token is missing or invalid", async ({ request }) => {
    // Attempt to access without token
    const res = await request.get("/api/order/CLAY-FAKE1234");
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBeTruthy();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});
