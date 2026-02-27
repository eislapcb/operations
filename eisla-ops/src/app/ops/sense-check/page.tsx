import { db } from "@/db";
import { orders, orderAutoReview } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/session";
import SenseCheckQueue from "@/components/orders/SenseCheckQueue";

export const dynamic = "force-dynamic";

export default async function SenseCheckPage() {
  await requireRole("admin");

  const senseOrders = await db
    .select({
      id: orders.id,
      number: orders.number,
      customerName: orders.customerName,
      tier: orders.tier,
      description: orders.description,
    })
    .from(orders)
    .where(eq(orders.stage, "sense_check"));

  // Get auto review results for each
  const ordersWithReviews = await Promise.all(
    senseOrders.map(async (order) => {
      const [review] = await db
        .select()
        .from(orderAutoReview)
        .where(eq(orderAutoReview.orderId, order.id));
      return { ...order, autoReview: review ?? null };
    })
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-teal">Sense Check Queue</h1>
      {ordersWithReviews.length === 0 ? (
        <p className="text-sm text-gray-400">No orders awaiting sense check</p>
      ) : (
        <SenseCheckQueue orders={ordersWithReviews} />
      )}
    </div>
  );
}
