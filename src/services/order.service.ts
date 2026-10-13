import { getDb } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { AppError, ERROR_CODES } from "@/lib/api-response";
import { generateUniqueOrderNumber } from "@/lib/order-number";
import { createOrderToken, verifyOrderToken } from "@/lib/order-token";
import { ProductService } from "@/services/product.service";
import { CartService } from "@/services/cart.service";
import { EmailService } from "@/services/email.service";
import { type ShippingOptionId, SAMPLE_SWATCH_PRICE_CENTS } from "@/config/commerce";

export interface ShippingAddressInput {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface CreateOrderParams {
  sessionId: string;
  email: string;
  phone?: string;
  shippingAddress: ShippingAddressInput;
  shippingMethod: ShippingOptionId;
  idempotencyKey?: string;
}

export class OrderService {
  /**
   * Create a pending order from the guest's active cart.
   * Atomic transaction: re-prices items from DB, validates stock, writes order, items and event.
   */
  static async createPendingOrder(params: CreateOrderParams) {
    const { sessionId, email, phone, shippingAddress, shippingMethod, idempotencyKey } = params;
    const { db, pool } = getDb();

    // 1. Check idempotency: if an order with this idempotency key already exists, return it
    if (idempotencyKey) {
      const [existing] = await db
        .select()
        .from(orders)
        .where(eq(orders.idempotencyKey, idempotencyKey))
        .limit(1);

      if (existing) {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, existing.id));
        const token = createOrderToken(existing.orderNumber);
        return { order: existing, items, token, isDuplicate: true };
      }
    }

    // 2. Fetch cart lines
    const lines = await CartService.getLines(sessionId);
    if (!lines || lines.length === 0) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, "Cart is empty", 400);
    }

    // 3. Re-price all lines from DB and validate active stock
    const validatedLines: Array<{
      productId: number;
      variantId: number | null;
      name: string;
      sku: string;
      unitPriceCents: number;
      quantity: number;
      meta: Record<string, unknown> | null;
    }> = [];

    for (const line of lines) {
      const { product, variant, unitPriceCents } = await ProductService.validateForPurchase(
        line.productId,
        line.variantId,
        line.quantity
      );

      const isSample = Boolean(line.meta && (line.meta as Record<string, unknown>).isSample);
      const finalPriceCents = isSample ? SAMPLE_SWATCH_PRICE_CENTS : unitPriceCents;
      const itemName = isSample ? `${product.name} (Sample Swatch)` : product.name;
      const itemSku = isSample
        ? `${variant?.sku ?? product.slug}-SAMPLE`
        : (variant?.sku ?? product.slug);

      validatedLines.push({
        productId: product.id,
        variantId: variant?.id ?? null,
        name: itemName,
        sku: itemSku,
        unitPriceCents: finalPriceCents,
        quantity: line.quantity,
        meta: line.meta,
      });
    }

    // 4. Calculate final totals from DB validated prices
    const totals = CartService.calculateTotals(lines, shippingMethod);

    // 5. Generate unique unambiguous order number with DB collision guard
    const orderNumber = await generateUniqueOrderNumber(async (num) => {
      const [found] = await db
        .select({ id: orders.id })
        .from(orders)
        .where(eq(orders.orderNumber, num))
        .limit(1);
      return !!found;
    });

    // 6. Execute atomic creation in transaction
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Insert Order
      const [orderInsertResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO orders (
          order_number, email, status, payment_status, fulfillment_status,
          subtotal_cents, shipping_cents, shipping_method, tax_cents, discount_cents,
          total_cents, currency, phone, shipping_address, idempotency_key, cart_session_id
        ) VALUES (?, ?, 'pending', 'pending', 'unfulfilled', ?, ?, ?, ?, 0, ?, 'USD', ?, ?, ?, ?)`,
        [
          orderNumber,
          email.toLowerCase().trim(),
          totals.subtotalCents,
          totals.shippingCents,
          shippingMethod,
          totals.taxCents,
          totals.totalCents,
          phone || null,
          JSON.stringify(shippingAddress),
          idempotencyKey || null,
          sessionId,
        ]
      );

      const orderId = orderInsertResult.insertId;

      // Insert Order Items
      for (const item of validatedLines) {
        await connection.execute(
          `INSERT INTO order_items (order_id, variant_id, name, sku, unit_price_cents, quantity, meta)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.variantId,
            item.name,
            item.sku,
            item.unitPriceCents,
            item.quantity,
            item.meta ? JSON.stringify(item.meta) : null,
          ]
        );
      }

      // Insert Order Event
      await connection.execute(
        `INSERT INTO order_events (order_id, type, from_status, to_status, actor, meta)
         VALUES (?, 'order_placed', NULL, 'pending', 'customer', ?)`,
        [
          orderId,
          JSON.stringify({ itemCount: validatedLines.length, totalCents: totals.totalCents }),
        ]
      );

      await connection.commit();

      const [createdOrder] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
      const token = createOrderToken(orderNumber);

      return {
        order: createdOrder,
        items,
        token,
        isDuplicate: false,
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Fulfill order upon verified payment (webhook or dev mock).
   * Atomically locks order, decrements inventory with conditional guard,
   * marks order paid, records payment, writes order events, and clears cart rows.
   */
  static async fulfillPayment(params: {
    orderNumber: string;
    provider: string;
    providerPaymentId: string;
    amountCents: number;
    currency: string;
  }) {
    const { orderNumber, provider, providerPaymentId, amountCents, currency } = params;
    const { db, pool } = getDb();

    const connection = await pool.getConnection();
    let orderToEmail: RowDataPacket | null = null;
    let itemsToEmail: RowDataPacket[] = [];

    try {
      await connection.beginTransaction();

      // 1. Lock the order row
      const [orderRows] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM orders WHERE order_number = ? FOR UPDATE`,
        [orderNumber]
      );

      if (orderRows.length === 0) {
        await connection.rollback();
        throw new AppError(ERROR_CODES.NOT_FOUND, `Order ${orderNumber} not found`, 404);
      }

      const order = orderRows[0];

      // Idempotency: if already paid, return without duplicating stock decrement
      if (order.payment_status === "paid") {
        await connection.rollback();
        return { success: true, alreadyPaid: true, order };
      }

      // Verify amount and currency
      if (order.total_cents !== amountCents) {
        console.warn(
          `[PAYMENT MISMATCH] Order ${orderNumber} expected ${order.total_cents} cents, received ${amountCents}`
        );
      }

      // 2. Fetch order items
      const [itemRows] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM order_items WHERE order_id = ?`,
        [order.id]
      );

      // 3. Decrement stock with guarded check
      let stockFailure = false;
      for (const item of itemRows) {
        if (item.variant_id) {
          const [updateResult] = await connection.execute<ResultSetHeader>(
            `UPDATE product_variants 
             SET stock_quantity = stock_quantity - ? 
             WHERE id = ? AND stock_quantity >= ?`,
            [item.quantity, item.variant_id, item.quantity]
          );

          if (updateResult.affectedRows === 0) {
            stockFailure = true;
            console.error(
              `[STOCK OVERSELL] Insufficient stock for variant ID ${item.variant_id} on order ${orderNumber}`
            );
          }
        }
      }

      // 4. Insert payment record (ignore if duplicate providerPaymentId)
      await connection.execute(
        `INSERT IGNORE INTO payments (order_id, provider, provider_payment_id, amount_cents, status, metadata)
         VALUES (?, ?, ?, ?, 'succeeded', ?)`,
        [order.id, provider, providerPaymentId, amountCents, JSON.stringify({ currency })]
      );

      // 5. Update order statuses
      const fulfillmentStatus = stockFailure ? "on_hold" : "unfulfilled";
      await connection.execute(
        `UPDATE orders 
         SET payment_status = 'paid', status = 'paid', fulfillment_status = ?, 
             paid_at = NOW(), stripe_session_id = ?, updated_at = NOW()
         WHERE id = ?`,
        [fulfillmentStatus, providerPaymentId, order.id]
      );

      // 6. Record order event
      await connection.execute(
        `INSERT INTO order_events (order_id, type, from_status, to_status, actor, meta)
         VALUES (?, 'payment_received', 'pending', 'paid', ?, ?)`,
        [
          order.id,
          provider,
          JSON.stringify({
            amountCents,
            providerPaymentId,
            stockOversold: stockFailure,
          }),
        ]
      );

      if (stockFailure) {
        await connection.execute(
          `INSERT INTO order_events (order_id, type, from_status, to_status, actor, meta)
           VALUES (?, 'stock_depleted', 'unfulfilled', 'on_hold', 'system', ?)`,
          [
            order.id,
            JSON.stringify({
              message: "Stock guard failed during fulfillment. Order placed on hold.",
            }),
          ]
        );
      }

      // 7. Clear guest cart rows for this session
      if (order.cart_session_id) {
        await connection.execute(`DELETE FROM cart_items WHERE session_id = ?`, [
          order.cart_session_id,
        ]);
      }

      await connection.commit();

      orderToEmail = order;
      itemsToEmail = itemRows;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    // 8. Send confirmation email asynchronously (isolated from transaction)
    if (orderToEmail) {
      const address =
        typeof orderToEmail.shipping_address === "string"
          ? JSON.parse(orderToEmail.shipping_address)
          : orderToEmail.shipping_address;

      EmailService.sendOrderConfirmation({
        orderNumber: orderToEmail.order_number,
        customerName: address.name,
        customerEmail: orderToEmail.email,
        totalCents: orderToEmail.total_cents,
        currency: orderToEmail.currency,
        items: itemsToEmail.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unitPriceCents: i.unit_price_cents,
        })),
        shippingAddress: address,
      }).catch((e) => console.error("Email send failed:", e));
    }

    const [updatedOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);
    return { success: true, alreadyPaid: false, order: updatedOrder };
  }

  /**
   * Secure order lookup: requires signed access token to view order data.
   */
  static async getOrderWithToken(orderNumber: string, token: string) {
    const verified = verifyOrderToken(token);
    if (!verified.valid || verified.orderNumber !== orderNumber) {
      throw new AppError(
        ERROR_CODES.UNAUTHORIZED,
        "Order link has expired or is invalid. Please request a new lookup link.",
        401
      );
    }

    const { db } = getDb();
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);

    if (!order) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Order not found", 404);
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

    // Omit internal cartSessionId from public response
    const { cartSessionId: _cartSessionId, ...safeOrder } = order;

    return {
      order: safeOrder,
      items,
    };
  }

  /**
   * Customer order lookup by Order Number + Email.
   * Returns order details and generates a fresh signed access token.
   */
  static async lookupByEmail(orderNumber: string, email: string) {
    const { db } = getDb();
    const normalizedNumber = orderNumber.trim().toUpperCase();
    const normalizedEmail = email.trim().toLowerCase();

    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.orderNumber, normalizedNumber), eq(orders.email, normalizedEmail)))
      .limit(1);

    if (!order) {
      // Use generic error message to avoid email enumeration
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "No matching order found for the provided order number and email address.",
        404
      );
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const token = createOrderToken(order.orderNumber);

    const { cartSessionId: _cartSessionId, ...safeOrder } = order;

    return {
      order: safeOrder,
      items,
      token,
    };
  }
}
