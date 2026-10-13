import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";
import { cartCount, cartTotalCents, getCartLines, removeCartItem, updateCartItemQuantity } from "@/lib/cart";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionId) return NextResponse.json({ error: "No session" }, { status: 400 });

  const body = await request.json().catch(() => null);
  const quantity = Math.floor(Number(body?.quantity));
  if (Number.isNaN(quantity)) {
    return NextResponse.json({ error: "quantity is required" }, { status: 400 });
  }

  await updateCartItemQuantity(Number(id), sessionId, quantity);
  const lines = await getCartLines(sessionId);
  return NextResponse.json({ ok: true, count: cartCount(lines), totalCents: cartTotalCents(lines) });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionId) return NextResponse.json({ error: "No session" }, { status: 400 });

  await removeCartItem(Number(id), sessionId);
  const lines = await getCartLines(sessionId);
  return NextResponse.json({ ok: true, count: cartCount(lines), totalCents: cartTotalCents(lines) });
}
