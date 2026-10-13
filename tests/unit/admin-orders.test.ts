import { describe, it, expect } from "vitest";
import dotenv from "dotenv";
import { AdminOrderService } from "@/services/admin-orders.service";

dotenv.config();

describe("AdminOrderService (Task 5.1)", () => {
  it("lists orders with default pagination", async () => {
    const result = await AdminOrderService.listOrders({ limit: 10 });
    expect(result).toHaveProperty("orders");
    expect(result).toHaveProperty("pagination");
    expect(Array.isArray(result.orders)).toBe(true);
    expect(result.pagination.limit).toBe(10);
    expect(result.pagination.page).toBe(1);
  });

  it("filters orders by fulfillmentStatus", async () => {
    const result = await AdminOrderService.listOrders({
      fulfillmentStatus: "unfulfilled",
      limit: 5,
    });
    for (const ord of result.orders) {
      expect(ord.fulfillmentStatus).toBe("unfulfilled");
    }
  });
});
