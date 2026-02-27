import { db } from "@/db";
import { orders } from "@/db/schema";
import { sql } from "drizzle-orm";
import { STAGES, STAGE_LABELS, SLA_TARGETS, calcSlaStatus } from "@/lib/constants";
import type { SlaStatus } from "@/lib/constants";
import SLABadge from "@/components/orders/SLABadge";
import Badge from "@/components/ui/Badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const allOrders = await db
    .select({
      id: orders.id,
      number: orders.number,
      customerName: orders.customerName,
      stage: orders.stage,
      tier: orders.tier,
      serviceLevel: orders.serviceLevel,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .where(sql`${orders.stage} != 'complete'`);

  // Group by stage
  const byStage = new Map<string, typeof allOrders>();
  for (const stage of STAGES) {
    byStage.set(stage, []);
  }
  for (const order of allOrders) {
    const list = byStage.get(order.stage) ?? [];
    list.push(order);
    byStage.set(order.stage, list);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-teal">Pipeline</h1>
        <Link
          href="/ops/orders/new"
          className="rounded-md bg-copper px-4 py-2 text-sm font-medium text-white hover:bg-copper/90"
        >
          New Order
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.filter((s) => s !== "complete").map((stage) => {
          const stageOrders = byStage.get(stage) ?? [];

          return (
            <div
              key={stage}
              className="flex-shrink-0 w-64 rounded-lg bg-light p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase text-teal">
                  {STAGE_LABELS[stage]}
                </h3>
                <span className="text-xs text-gray-400">
                  {stageOrders.length}
                </span>
              </div>

              <div className="space-y-2">
                {stageOrders.map((order) => {
                  let slaStatus: SlaStatus = "on_track";
                  const targets = SLA_TARGETS[order.stage];
                  if (targets && order.serviceLevel && order.updatedAt) {
                    const target = targets[order.serviceLevel];
                    if (target) {
                      const elapsed =
                        (Date.now() -
                          new Date(order.updatedAt).getTime()) /
                        (1000 * 60 * 60);
                      slaStatus = calcSlaStatus(elapsed, target);
                    }
                  }

                  return (
                    <Link
                      key={order.id}
                      href={`/ops/orders/${order.id}`}
                      className="block rounded-md bg-white p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-copper">
                          {order.number}
                        </span>
                        <SLABadge status={slaStatus} />
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {order.customerName ?? "No customer"}
                      </p>
                      <div className="mt-1 flex gap-1">
                        <Badge variant="copper">{order.tier}</Badge>
                        <Badge>{order.serviceLevel}</Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
