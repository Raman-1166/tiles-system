import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const baseDbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!baseDbUrl) {
  console.error("Error: Neither TEST_DATABASE_URL nor DATABASE_URL found.");
  process.exit(1);
}

// Extract base URL without database name
const parsed = new URL(baseDbUrl);
const testDbName = "app_db_test";
const serverUrl = `${parsed.protocol}//${parsed.username}:${parsed.password}@${parsed.host}`;
const testDbUrl = `${serverUrl}/${testDbName}`;

async function setupTestDb() {
  console.log(`Setting up test database: ${testDbName} on ${parsed.host}...`);

  const serverConn = await mysql.createConnection(serverUrl);
  await serverConn.execute(
    `CREATE DATABASE IF NOT EXISTS \`${testDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
  );
  await serverConn.end();
  console.log(`✓ Database '${testDbName}' verified.`);

  const testConn = await mysql.createConnection(testDbUrl);

  const migrationsDir = path.resolve(__dirname, "../drizzle");
  const migrationFiles = [
    "0000_fearless_abomination.sql",
    "0001_nosy_taskmaster.sql",
    "0002_industry_readiness_phase1.sql",
  ];

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    if (!fs.existsSync(filePath)) continue;

    console.log(`Applying migration: ${file}...`);
    const content = fs.readFileSync(filePath, "utf-8");
    const statements = content
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      try {
        await testConn.query(statement);
      } catch (err) {
        // Table already exists or harmless warning
        if (!err.message.includes("already exists")) {
          console.warn(`Migration statement warning: ${err.message}`);
        }
      }
    }
  }

  await testConn.end();
  console.log(`✓ Test database '${testDbName}' successfully migrated and isolated from dev DB.`);
}

setupTestDb().catch((err) => {
  console.error("Failed to setup test database:", err);
  process.exit(1);
});
