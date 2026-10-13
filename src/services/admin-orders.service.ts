import { getDb } from "@/db";
import { orders, orderItems, orderEvents } from "@/db/schema";
import { eq, desc, and, like, or, sql } from "drizzle-orm";
import { AppError, ERROR_CODES } from "@/lib/api-response";

export interface ListAdminOrdersParams {
  fulfillmentStatus?: string;
  paymentStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export type ValidFulfillmentStatus =
  "unfulfilled" | "packed" | "shipped" | "delivered" | "cancelled" | "on_hold";

export class AdminOrderService {
  /**
   * List all customer orders for the admin fulfillment dashboard.
   */
  static async listOrders(params: ListAdminOrdersParams = {}) {
    const { db } = getDb();
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 25));
    const offset = (page - 1) * limit;

    const conditions = [];

    if (params.fulfillmentStatus && params.fulfillmentStatus !== "all") {
      conditions.push(eq(orders.fulfillmentStatus, params.fulfillmentStatus));
    }

    if (params.paymentStatus && params.paymentStatus !== "all") {
      conditions.push(eq(orders.paymentStatus, params.paymentStatus));
    }

    if (params.search && params.search.trim()) {
      const q = `%${params.search.trim()}%`;
      conditions.push(
        or(like(orders.orderNumber, q), like(orders.email, q), like(orders.trackingNumber, q))
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const orderRows = await db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    // Get order items count and summary
    const ordersWithDetails = await Promise.all(
      orderRows.map(async (ord) => {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, ord.id));
        return {
          ...ord,
          itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
          items,
        };
      })
    );

    // Count total matching orders for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(whereClause);

    const totalOrders = Number(countResult?.count || 0);

    return {
      orders: ordersWithDetails,
      pagination: {
        page,
        limit,
        totalOrders,
        totalPages: Math.ceil(totalOrders / limit) || 1,
      },
    };
  }

  /**
   * Retrieve single order details including full audit trail.
   */
  static async getOrderDetails(orderId: number) {
    const { db } = getDb();

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    if (!order) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Order not found", 404);
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

    const events = await db
      .select()
      .from(orderEvents)
      .where(eq(orderEvents.orderId, order.id))
      .orderBy(desc(orderEvents.createdAt));

    return {
      order,
      items,
      events,
    };
  }

  /**
   * Update order fulfillment status and tracking number with audit event.
   */
  static async updateFulfillment(
    orderId: number,
    params: {
      fulfillmentStatus: ValidFulfillmentStatus;
      trackingNumber?: string;
      actor?: string;
      note?: string;
    }
  ) {
    const { db } = getDb();
    const actor = params.actor || "admin";

    const [existing] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    if (!existing) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Order not found", 404);
    }

    const prevFulfillmentStatus = existing.fulfillmentStatus;
    const newTrackingNumber =
      params.trackingNumber !== undefined
        ? params.trackingNumber.trim() || null
        : existing.trackingNumber;

    // Update order
    await db
      .update(orders)
      .set({
        fulfillmentStatus: params.fulfillmentStatus,
        trackingNumber: newTrackingNumber,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // Insert audit event
    await db.insert(orderEvents).values({
      orderId,
      type: "status_changed",
      fromStatus: prevFulfillmentStatus,
      toStatus: params.fulfillmentStatus,
      actor,
      meta: {
        trackingNumber: newTrackingNumber,
        note: params.note || null,
        timestamp: new Date().toISOString(),
      },
    });

    return this.getOrderDetails(orderId);
  }
}
