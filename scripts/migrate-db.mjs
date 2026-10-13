import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("Error: DATABASE_URL not set.");
  process.exit(1);
}

async function runMigration() {
  const conn = await mysql.createConnection(dbUrl);
  console.log("Connected to database for migration...");

  const migrationFile = path.resolve(__dirname, "../drizzle/0002_industry_readiness_phase1.sql");
  const content = fs.readFileSync(migrationFile, "utf-8");

  const statements = content
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(
    `Executing ${statements.length} migration statements from 0002_industry_readiness_phase1.sql...`
  );

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await conn.query(stmt);
      console.log(`  [${i + 1}/${statements.length}] Done: ${stmt.slice(0, 50)}...`);
    } catch (err) {
      if (err.message.includes("Duplicate") || err.message.includes("already exists")) {
        console.warn(`  [${i + 1}/${statements.length}] Notice: ${err.message}`);
      } else {
        console.error(`  [${i + 1}/${statements.length}] Error:`, err.message);
        throw err;
      }
    }
  }

  console.log("✓ Migration 0002 successfully applied!");
  await conn.end();
}

runMigration().catch((err) => {
  console.error("Migration execution failed:", err);
  process.exit(1);
});
