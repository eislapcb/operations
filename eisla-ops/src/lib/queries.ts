import { db } from "@/db";
import { orders, orderSenseCheck, exceptions, orderEngineerReview } from "@/db/schema";
import { eq, and, isNull, sql, count } from "drizzle-orm";
import { SLA_TARGETS, calcSlaStatus } from "./constants";
import type { SlaStatus } from "./constants";

// ─── Badge Counts for Sidebar ───────────────────────────────────────

export async function getOverdueOrderCount(): Promise<number> {
  const activeOrders = await db
    .select({
      id: orders.id,
      stage: orders.stage,
      serviceLevel: orders.serviceLevel,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .where(
      and(
        sql`${orders.stage} NOT IN ('complete', 'delivered')`
      )
    );

  let overdueCount = 0;
  for (const order of activeOrders) {
    const targets = SLA_TARGETS[order.stage];
    if (!targets || !order.serviceLevel || !order.updatedAt) continue;
    const targetHours = targets[order.serviceLevel];
    if (!targetHours) continue;
    const elapsed =
      (Date.now() - new Date(order.updatedAt).getTime()) / (1000 * 60 * 60);
    if (calcSlaStatus(elapsed, targetHours) === "overdue") {
      overdueCount++;
    }
  }
  return overdueCount;
}

export async function getSenseCheckCount(): Promise<number> {
  const result = await db
    .select({ value: count() })
    .from(orders)
    .where(eq(orders.stage, "sense_check"));
  return result[0]?.value ?? 0;
}

export async function getExceptionsCount(): Promise<number> {
  const result = await db
    .select({ value: count() })
    .from(exceptions)
    .where(eq(exceptions.resolved, false));
  return result[0]?.value ?? 0;
}

export async function getEngineerQueueCount(): Promise<number> {
  const result = await db
    .select({ value: count() })
    .from(orders)
    .where(eq(orders.stage, "engineer_review"));
  return result[0]?.value ?? 0;
}

export interface BadgeCounts {
  overdue: number;
  senseCheck: number;
  exceptions: number;
  engineerQueue: number;
}

export async function getBadgeCounts(): Promise<BadgeCounts> {
  const [overdue, senseCheck, exceptionsCount, engineerQueue] =
    await Promise.all([
      getOverdueOrderCount(),
      getSenseCheckCount(),
      getExceptionsCount(),
      getEngineerQueueCount(),
    ]);

  return { overdue, senseCheck, exceptions: exceptionsCount, engineerQueue };
}

// ─── SLA Calculation per Order ──────────────────────────────────────
export interface OrderSla {
  status: SlaStatus;
  percent: number;
  targetHours: number;
  elapsedHours: number;
}

export function calcOrderSla(
  stage: string,
  serviceLevel: string,
  stageEnteredAt: Date | string
): OrderSla | null {
  const targets = SLA_TARGETS[stage];
  if (!targets) return null;
  const targetHours = targets[serviceLevel];
  if (!targetHours) return null;

  const elapsed =
    (Date.now() - new Date(stageEnteredAt).getTime()) / (1000 * 60 * 60);
  const status = calcSlaStatus(elapsed, targetHours);
  const percent = Math.min((elapsed / targetHours) * 100, 100);

  return { status, percent, targetHours, elapsedHours: elapsed };
}
