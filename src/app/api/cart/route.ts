import { NextRequest, NextResponse } from "next/server";
import { getOrCreateSessionId, SESSION_COOKIE } from "@/lib/session";
import { addToCart, cartCount, cartTotalCents, getCartLines } from "@/lib/cart";

export async function GET(request: NextRequest) {
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value ?? null;
  const lines = await getCartLines(sessionId);
  return NextResponse.json({
    lines,
    count: cartCount(lines),
    totalCents: cartTotalCents(lines),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const productId = Number(body?.productId);
  const variantId = body?.variantId ? Number(body.variantId) : undefined;
  const quantity = Math.max(1, Math.floor(Number(body?.quantity) || 1));
  const variant = typeof body?.variant === "string" ? body.variant : null;
  const meta =
    body?.meta && typeof body.meta === "object" ? (body.meta as Record<string, unknown>) : null;

  if (!productId || Number.isNaN(productId)) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  const sessionId = getOrCreateSessionId(request, response);

  const item = await addToCart({ sessionId, productId, variantId, quantity, variant, meta });
  const lines = await getCartLines(sessionId);

  return NextResponse.json(
    { ok: true, item, count: cartCount(lines), totalCents: cartTotalCents(lines) },
    { headers: response.headers }
  );
}
