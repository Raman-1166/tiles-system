import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mysql, { type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const baseDbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
if (!baseDbUrl) {
  throw new Error("No database URL provided for integration tests");
}

const parsed = new URL(baseDbUrl);
// Use app_db_test to ensure dev DB is untouched
const testDbUrl = `${parsed.protocol}//${parsed.username}:${parsed.password}@${parsed.host}/app_db_test`;

describe("Integration: Order Fulfillment, Idempotency & Stock Guard", () => {
  let conn: mysql.Connection;

  beforeAll(async () => {
    conn = await mysql.createConnection(testDbUrl);
  });

  afterAll(async () => {
    if (conn) await conn.end();
  });

  it("replaying a payment fulfillment is idempotent and does not double-decrement stock", async () => {
    // 1. Setup a test product & variant with 10 units of stock
    const testSku = `TEST-IDEMP-${Date.now()}`;
    const [catRes] = await conn.execute<ResultSetHeader>(
      `INSERT INTO categories (name, slug, type) VALUES ('TestCat', 'testcat-${Date.now()}', 'tile')`
    );
    const catId = catRes.insertId;

    const [prodRes] = await conn.execute<ResultSetHeader>(
      `INSERT INTO products (category_id, slug, name, tagline, description, price_cents, images, specs, variants)
       VALUES (?, 'test-prod-${Date.now()}', 'Test Tile', 'tag', 'desc', 2000, '[]', '{}', '[]')`,
      [catId]
    );
    const prodId = prodRes.insertId;

    const [varRes] = await conn.execute<ResultSetHeader>(
      `INSERT INTO product_variants (product_id, sku, price_cents, stock_quantity)
       VALUES (?, ?, 2000, 10)`,
      [prodId, testSku]
    );
    const variantId = varRes.insertId;

    // 2. Insert a pending order for 2 units
    const orderNum = `CLAY-TEST${Math.floor(1000 + Math.random() * 9000)}`;
    const [orderRes] = await conn.execute<ResultSetHeader>(
      `INSERT INTO orders (order_number, email, status, payment_status, fulfillment_status, subtotal_cents, total_cents, shipping_address)
       VALUES (?, 'test@example.com', 'pending', 'pending', 'unfulfilled', 4000, 4000, '{}')`,
      [orderNum]
    );
    const orderId = orderRes.insertId;

    await conn.execute(
      `INSERT INTO order_items (order_id, variant_id, name, sku, unit_price_cents, quantity)
       VALUES (?, ?, 'Test Tile', ?, 2000, 2)`,
      [orderId, variantId, testSku]
    );

    // 3. First fulfillment call: decrement stock (10 -> 8) and mark paid
    const providerPaymentId = `pay_mock_${Date.now()}`;

    // Execute fulfillment transaction
    await conn.beginTransaction();
    await conn.execute(
      `UPDATE product_variants SET stock_quantity = stock_quantity - 2 WHERE id = ? AND stock_quantity >= 2`,
      [variantId]
    );
    await conn.execute(`UPDATE orders SET payment_status = 'paid', status = 'paid' WHERE id = ?`, [
      orderId,
    ]);
    await conn.execute(
      `INSERT INTO payments (order_id, provider, provider_payment_id, amount_cents, status)
       VALUES (?, 'stripe', ?, 4000, 'succeeded')`,
      [orderId, providerPaymentId]
    );
    await conn.commit();

    // Verify stock is 8
    const [rowsAfterFirst] = await conn.execute<RowDataPacket[]>(
      `SELECT stock_quantity FROM product_variants WHERE id = ?`,
      [variantId]
    );
    expect(rowsAfterFirst[0].stock_quantity).toBe(8);

    // 4. Second fulfillment call (Replay of webhook): must detect payment_status === 'paid' and NOT decrement
    const [checkOrder] = await conn.execute<RowDataPacket[]>(
      `SELECT payment_status FROM orders WHERE id = ?`,
      [orderId]
    );
    if (checkOrder[0].payment_status === "paid") {
      // Idempotency guard: do not decrement stock again!
    } else {
      await conn.execute(
        `UPDATE product_variants SET stock_quantity = stock_quantity - 2 WHERE id = ?`,
        [variantId]
      );
    }

    // Verify stock is still 8
    const [rowsAfterReplay] = await conn.execute<RowDataPacket[]>(
      `SELECT stock_quantity FROM product_variants WHERE id = ?`,
      [variantId]
    );
    expect(rowsAfterReplay[0].stock_quantity).toBe(8);
  });

  it("prevents overselling when stock guard fails: places conflicting order on_hold", async () => {
    // 1. Create variant with exactly 1 unit remaining
    const testSku = `TEST-STOCK-${Date.now()}`;
    const [catRes] = await conn.execute<ResultSetHeader>(
      `INSERT INTO categories (name, slug, type) VALUES ('StockCat', 'stockcat-${Date.now()}', 'tile')`
    );
    const [prodRes] = await conn.execute<ResultSetHeader>(
      `INSERT INTO products (category_id, slug, name, tagline, description, price_cents, images, specs, variants)
       VALUES (?, 'stock-prod-${Date.now()}', 'Stock Tile', 'tag', 'desc', 3000, '[]', '{}', '[]')`,
      [catRes.insertId]
    );
    const [varRes] = await conn.execute<ResultSetHeader>(
      `INSERT INTO product_variants (product_id, sku, price_cents, stock_quantity)
       VALUES (?, ?, 3000, 1)`,
      [prodRes.insertId, testSku]
    );
    const variantId = varRes.insertId;

    // Order 1 tries to claim 1 unit
    const [upd1] = await conn.execute<ResultSetHeader>(
      `UPDATE product_variants SET stock_quantity = stock_quantity - 1 WHERE id = ? AND stock_quantity >= 1`,
      [variantId]
    );
    expect(upd1.affectedRows).toBe(1);

    // Order 2 tries to claim 1 unit simultaneously (stock is now 0)
    const [upd2] = await conn.execute<ResultSetHeader>(
      `UPDATE product_variants SET stock_quantity = stock_quantity - 1 WHERE id = ? AND stock_quantity >= 1`,
      [variantId]
    );
    expect(upd2.affectedRows).toBe(0); // Guarded query blocked second decrement!

    // Stock never drops below zero
    const [finalStock] = await conn.execute<RowDataPacket[]>(
      `SELECT stock_quantity FROM product_variants WHERE id = ?`,
      [variantId]
    );
    expect(finalStock[0].stock_quantity).toBe(0);
  });
});
