import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const allCustomers = await db
    .select()
    .from(customers)
    .orderBy(desc(customers.createdAt));

  return NextResponse.json(allCustomers);
}
