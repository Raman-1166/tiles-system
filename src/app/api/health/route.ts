import { getDb } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { db } = getDb();
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, status: "healthy" });
  } catch (error) {
    const isProd = process.env.NODE_ENV === "production";
    return Response.json(
      {
        ok: false,
        status: "unhealthy",
        ...(isProd ? {} : { error: error instanceof Error ? error.message : "Unknown error" }),
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
  }
}
