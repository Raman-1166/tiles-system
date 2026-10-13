import { drizzle } from "drizzle-orm/mysql2";
import type { MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "@/lib/env";

const globalForDb = globalThis as typeof globalThis & {
  __tilestorePool?: mysql.Pool;
  __tilestoreDb?: MySql2Database;
};

let pool: mysql.Pool | undefined;
let db: MySql2Database | undefined;

function getDb() {
  const databaseUrl = env.DATABASE_URL;

  if (!pool) {
    pool = globalForDb.__tilestorePool ?? mysql.createPool(databaseUrl);

    if (process.env.NODE_ENV !== "production") {
      globalForDb.__tilestorePool = pool;
    }
  }

  if (!db) {
    db = drizzle(pool) as MySql2Database;

    if (process.env.NODE_ENV !== "production") {
      globalForDb.__tilestoreDb = db;
    }
  }

  return { db, pool };
}

export { getDb };
