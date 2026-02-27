import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const allOrders = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt));

  return NextResponse.json(allOrders);
}
