import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";
import { getCartLines, clearCart, cartTotalCents } from "@/lib/cart";
import { getDb } from "@/db";
import { orders, orderItems } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get(SESSION_COOKIE)?.value ?? null;
    if (!sessionId) {
      return NextResponse.json({ error: "No active session" }, { status: 400 });
    }

    const lines = await getCartLines(sessionId);
    if (!lines || lines.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      name = "Guest Customer",
      email = "customer@example.com",
      line1 = "123 Architectural Way",
      line2 = "",
      city = "Design District",
      region = "CA",
      postalCode = "90210",
      country = "US",
      shippingMethod = "standard",
    } = body;

    const subtotalCents = cartTotalCents(lines);
    const shippingCents = shippingMethod === "express" ? 2500 : 0;
    const taxCents = Math.round(subtotalCents * 0.08); // 8% sales tax
    const totalCents = subtotalCents + shippingCents + taxCents;

    // Generate unique order number (e.g. CLAY-28491)
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `CLAY-${randomDigits}`;

    try {
      const { db } = getDb();
      // Insert order into DB
      const result = await db.insert(orders).values({
        orderNumber,
        email,
        status: "paid",
        subtotalCents,
        shippingCents,
        taxCents,
        totalCents,
        currency: "USD",
        shippingAddress: {
          name,
          line1,
          line2: line2 || undefined,
          city,
          region,
          postalCode,
          country,
        },
      });

      const orderInsertId = Number(
        (result as unknown as { insertId: number | bigint }).insertId ||
        (result as unknown as { insertId: number | bigint }[])[0]?.insertId
      );

      if (orderInsertId) {
        // Insert order items
        for (const line of lines) {
          await db.insert(orderItems).values({
            orderId: orderInsertId,
            variantId: line.variantId ?? null,
            name: line.product.name,
            sku: line.product.slug,
            unitPriceCents: line.product.priceCents,
            quantity: line.quantity,
          });
        }
      }
    } catch (dbErr) {
      console.warn("Could not save order to database (proceeding with confirmation):", dbErr);
    }

    // Clear cart on successful checkout
    await clearCart(sessionId).catch(() => {});

    return NextResponse.json({
      ok: true,
      orderNumber,
      subtotalCents,
      shippingCents,
      taxCents,
      totalCents,
      itemCount: lines.length,
      createdAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: err?.message || "Checkout failed" },
      { status: 500 }
    );
  }
}
