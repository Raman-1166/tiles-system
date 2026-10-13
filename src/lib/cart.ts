import { getDb } from "@/db";
import { cartItems, products, type CartItem, type Product } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export type CartLine = CartItem & { product: Product };

export async function getCartLines(sessionId: string | null): Promise<CartLine[]> {
  if (!sessionId) return [];
  const { db } = getDb();
  const rows = await db
    .select({ cart: cartItems, product: products })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.sessionId, sessionId));

  return rows.map((r) => ({ ...r.cart, product: r.product }));
}

export async function addToCart(params: {
  sessionId: string;
  productId: number;
  variantId?: number;
  quantity: number;
  variant?: string | null;
  meta?: Record<string, unknown> | null;
}): Promise<CartItem> {
  const { sessionId, productId, variantId, quantity, variant = null, meta = null } = params;
  const { db } = getDb();

  // If an identical line (same product + variant + matching meta) already exists, bump quantity.
  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.sessionId, sessionId), eq(cartItems.productId, productId)));
  const metaStr = meta ? JSON.stringify(meta) : null;
  const match = existing.find((e) => {
    const eMetaStr = e.meta ? JSON.stringify(e.meta) : null;
    return (
      (e.variant ?? null) === variant &&
      (e.variantId ?? null) === (variantId ?? null) &&
      eMetaStr === metaStr
    );
  });
  if (match) {
    await db
      .update(cartItems)
      .set({ quantity: match.quantity + quantity })
      .where(eq(cartItems.id, match.id));

    // MySQL: Read after update
    const [updated] = await db.select().from(cartItems).where(eq(cartItems.id, match.id)).limit(1);
    return updated;
  }

  // MySQL: Insert and read the result
  const result = await db
    .insert(cartItems)
    .values({ sessionId, productId, variantId, quantity, variant, meta });

  // Extract insertId from MySQL result
  const insertId = Number(
    (result as unknown as { insertId: number | bigint }).insertId ||
      (result as unknown as { insertId: number | bigint }[])[0]?.insertId
  );

  const [created] = await db.select().from(cartItems).where(eq(cartItems.id, insertId)).limit(1);

  return created;
}

export async function updateCartItemQuantity(id: number, sessionId: string, quantity: number) {
  const { db } = getDb();
  if (quantity <= 0) {
    await db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.sessionId, sessionId)));
    return null;
  }
  await db
    .update(cartItems)
    .set({ quantity })
    .where(and(eq(cartItems.id, id), eq(cartItems.sessionId, sessionId)));

  // MySQL: Read after update
  const [updated] = await db.select().from(cartItems).where(eq(cartItems.id, id)).limit(1);
  return updated || null;
}

export async function removeCartItem(id: number, sessionId: string) {
  const { db } = getDb();
  await db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.sessionId, sessionId)));
}

export function cartTotalCents(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity * l.product.priceCents, 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

export async function clearCart(sessionId: string) {
  const { db } = getDb();
  await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
}
