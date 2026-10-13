import { getDb } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { db } = getDb();
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, status: "healthy" });
  } catch (error) {
    return Response.json(
      { ok: false, status: "unhealthy", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 503 }
    );
  }
}
