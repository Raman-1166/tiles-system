/**
 * scripts/cleanup-carts.mjs
 *
 * Maintenance script to purge guest cart rows that have been idle for > 90 days.
 * Run via cron or task scheduler:
 *   Linux: 0 3 * * * node /path/to/scripts/cleanup-carts.mjs >> /var/log/cart-cleanup.log 2>&1
 *   Windows: Register a Scheduled Task running 'node scripts/cleanup-carts.mjs' daily.
 */

import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("Error: DATABASE_URL not configured.");
  process.exit(1);
}

const IDLE_DAYS = 90;

async function cleanupIdleCarts() {
  console.log(`[${new Date().toISOString()}] Starting cart cleanup (idle > ${IDLE_DAYS} days)...`);
  const conn = await mysql.createConnection(dbUrl);

  try {
    const [result] = await conn.execute(
      `DELETE FROM cart_items WHERE updated_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [IDLE_DAYS]
    );

    const deletedCount = result.affectedRows ?? 0;
    console.log(`[${new Date().toISOString()}] ✓ Purged ${deletedCount} abandoned cart items.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ✗ Cleanup failed:`, error.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

cleanupIdleCarts();
