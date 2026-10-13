import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { env } from "@/lib/env";
import { sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, "ok" | "failed"> = {
    env: "ok",
    db: "failed",
  };

  try {
    // 1. Verify Environment is loaded
    if (!env.DATABASE_URL || !env.ADMIN_SESSION_SECRET) {
      checks.env = "failed";
      throw new Error("Missing critical environment configuration");
    }

    // 2. Verify Database connectivity
    const { db } = getDb();
    await db.execute(sql`SELECT 1`);
    checks.db = "ok";

    const latencyMs = Date.now() - startTime;

    return NextResponse.json(
      {
        ok: true,
        status: "ready",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        latencyMs,
        checks,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error: any) {
    logger.error("Readiness check probe failed", { error, checks });

    return NextResponse.json(
      {
        ok: false,
        status: "unready",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        checks,
        error:
          process.env.NODE_ENV === "production"
            ? "Service dependencies unavailable"
            : error.message,
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  }
}
