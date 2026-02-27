import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderComms } from "@/db/schema";
import { sql, eq, and, or, ilike, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const stage = searchParams.get("stage");
  const tier = searchParams.get("tier");
  const payment = searchParams.get("payment");
  const serviceLevel = searchParams.get("serviceLevel");

  if (!q && !stage && !tier && !payment && !serviceLevel) {
    return NextResponse.json([]);
  }

  const conditions = [];

  // Full-text search using tsvector
  if (q) {
    conditions.push(
      sql`${orders.stage} IS NOT NULL AND (
        ${orders}.search_vector @@ plainto_tsquery('english', ${q})
        OR ${orders.number} ILIKE ${"%" + q + "%"}
        OR ${orders.customerName} ILIKE ${"%" + q + "%"}
        OR ${orders.email} ILIKE ${"%" + q + "%"}
        OR ${orders.company} ILIKE ${"%" + q + "%"}
      )`
    );
  }

  if (stage) {
    conditions.push(eq(orders.stage, stage));
  }
  if (tier) {
    conditions.push(eq(orders.tier, tier));
  }
  if (payment) {
    conditions.push(eq(orders.paymentStatus, payment));
  }
  if (serviceLevel) {
    conditions.push(eq(orders.serviceLevel, serviceLevel));
  }

  const results = await db
    .select({
      id: orders.id,
      number: orders.number,
      customerName: orders.customerName,
      stage: orders.stage,
      tier: orders.tier,
      serviceLevel: orders.serviceLevel,
      paymentStatus: orders.paymentStatus,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(orders.updatedAt))
    .limit(50);

  return NextResponse.json(results);
}
