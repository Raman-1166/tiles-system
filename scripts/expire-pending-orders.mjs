/**
 * scripts/expire-pending-orders.mjs
 *
 * Maintenance script to mark pending orders unpaid after 24 hours as 'failed'.
 * Also logs an order_event for each expired order.
 * Schedule daily via cron or task scheduler.
 */

import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("Error: DATABASE_URL not configured.");
  process.exit(1);
}

const EXPIRY_HOURS = 24;

async function expirePendingOrders() {
  console.log(
    `[${new Date().toISOString()}] Expiring pending orders older than ${EXPIRY_HOURS} hours...`
  );
  const conn = await mysql.createConnection(dbUrl);

  try {
    // Find pending orders to expire
    const [rows] = await conn.execute(
      `SELECT id, order_number FROM orders 
       WHERE payment_status = 'pending' 
         AND created_at < DATE_SUB(NOW(), INTERVAL ? HOUR)`,
      [EXPIRY_HOURS]
    );

    if (rows.length === 0) {
      console.log(`[${new Date().toISOString()}] ✓ No pending orders to expire.`);
      return;
    }

    console.log(`Found ${rows.length} pending order(s) to expire.`);

    for (const order of rows) {
      await conn.execute(
        `UPDATE orders 
         SET payment_status = 'failed', status = 'cancelled', updated_at = NOW() 
         WHERE id = ?`,
        [order.id]
      );

      await conn.execute(
        `INSERT INTO order_events (order_id, type, from_status, to_status, actor, meta)
         VALUES (?, 'order_expired', 'pending', 'failed', 'system_cron', ?)`,
        [
          order.id,
          JSON.stringify({
            reason: "Unpaid after 24h timeout",
            expiredAt: new Date().toISOString(),
          }),
        ]
      );
      console.log(`  Expired order ${order.order_number} (ID: ${order.id})`);
    }

    console.log(`[${new Date().toISOString()}] ✓ Successfully expired ${rows.length} order(s).`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ✗ Expiry job failed:`, error.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

expirePendingOrders();
