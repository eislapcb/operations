import { db } from "@/db";
import { exceptions, orders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireRole } from "@/lib/session";
import ExceptionsList from "@/components/orders/ExceptionsList";

export const dynamic = "force-dynamic";

export default async function ExceptionsPage() {
  await requireRole("admin");

  const allExceptions = await db
    .select({
      id: exceptions.id,
      type: exceptions.type,
      description: exceptions.description,
      resolved: exceptions.resolved,
      resolvedBy: exceptions.resolvedBy,
      resolvedAt: exceptions.resolvedAt,
      createdAt: exceptions.createdAt,
      orderId: exceptions.orderId,
      orderNumber: orders.number,
    })
    .from(exceptions)
    .leftJoin(orders, eq(exceptions.orderId, orders.id))
    .orderBy(desc(exceptions.createdAt));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-teal">Exceptions</h1>
      <ExceptionsList exceptions={allExceptions} />
    </div>
  );
}
