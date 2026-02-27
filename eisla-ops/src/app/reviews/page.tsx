import { db } from "@/db";
import { orders, orderAutoReview, orderFiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/session";
import Link from "next/link";
import Badge from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export default async function ReviewQueuePage() {
  await requireSession();

  // Show orders at engineer_review stage
  const reviewOrders = await db
    .select({
      id: orders.id,
      number: orders.number,
      tier: orders.tier,
      // Anonymised: NO customer data, NO financials
    })
    .from(orders)
    .where(eq(orders.stage, "engineer_review"));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-teal">Engineer Review Queue</h1>
      {reviewOrders.length === 0 ? (
        <p className="text-sm text-gray-400">
          No orders awaiting engineer review
        </p>
      ) : (
        <div className="space-y-3">
          {reviewOrders.map((order) => (
            <Link
              key={order.id}
              href={`/reviews/${order.id}`}
              className="block rounded-lg bg-white p-4 shadow-sm border border-light hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-teal">
                  Review #{order.number.split("-").pop()}
                </span>
                <Badge variant="copper">{order.tier}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
