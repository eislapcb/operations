import { db } from "@/db";
import {
  orders,
  customers,
  ncrs,
  orderTimeline,
  orderComms,
} from "@/db/schema";
import { sql, eq, and, count, sum, desc, ne } from "drizzle-orm";
import {
  STAGES,
  STAGE_LABELS,
  SLA_TARGETS,
  TIER_PRICES,
  SERVICE_SURCHARGES,
  calcSlaStatus,
} from "./constants";
import type { SlaStatus } from "./constants";

export interface DashboardStats {
  activeOrders: number;
  totalCustomers: number;
  revenue: number;
  pipelineValue: number;
  slaCompliance: number;
  conversionRate: number;
  openNcrs: number;
  avgTurnaroundByTier: Record<string, string>;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [activeResult] = await db
    .select({ value: count() })
    .from(orders)
    .where(sql`${orders.stage} NOT IN ('complete')`);

  const [customersResult] = await db
    .select({ value: count() })
    .from(customers);

  // Revenue: sum of stripe_amount for paid orders
  const [revenueResult] = await db
    .select({ value: sum(orders.stripeAmount) })
    .from(orders)
    .where(eq(orders.paymentStatus, "Paid"));

  // Pipeline value: sum of fees for unpaid active orders
  const [pipelineResult] = await db
    .select({ value: sum(orders.fee) })
    .from(orders)
    .where(
      and(
        sql`${orders.stage} NOT IN ('complete')`,
        sql`${orders.paymentStatus} != 'Paid'`
      )
    );

  // SLA compliance: % of active orders that are on_track
  const activeOrders = await db
    .select({
      stage: orders.stage,
      serviceLevel: orders.serviceLevel,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .where(sql`${orders.stage} NOT IN ('complete')`);

  let onTrack = 0;
  for (const o of activeOrders) {
    const targets = SLA_TARGETS[o.stage];
    if (!targets || !o.serviceLevel || !o.updatedAt) continue;
    const target = targets[o.serviceLevel];
    if (!target) continue;
    const elapsed =
      (Date.now() - new Date(o.updatedAt).getTime()) / (1000 * 60 * 60);
    if (calcSlaStatus(elapsed, target) === "on_track") onTrack++;
  }
  const slaCompliance =
    activeOrders.length > 0
      ? Math.round((onTrack / activeOrders.length) * 100)
      : 100;

  // Conversion rate: quoted → accepted
  const [quotedCount] = await db
    .select({ value: count() })
    .from(orders)
    .where(sql`${orders.stage} != 'enquiry'`);
  const [acceptedCount] = await db
    .select({ value: count() })
    .from(orders)
    .where(sql`${orders.stage} NOT IN ('enquiry', 'quoted')`);
  const conversionRate =
    quotedCount.value > 0
      ? Math.round((acceptedCount.value / quotedCount.value) * 100)
      : 0;

  // Open NCRs
  const [ncrsResult] = await db
    .select({ value: count() })
    .from(ncrs)
    .where(eq(ncrs.status, "Open"));

  return {
    activeOrders: activeResult.value,
    totalCustomers: customersResult.value,
    revenue: Number(revenueResult.value ?? 0),
    pipelineValue: Number(pipelineResult.value ?? 0),
    slaCompliance,
    conversionRate,
    openNcrs: ncrsResult.value,
    avgTurnaroundByTier: { T1: "-", T2: "-", T3: "-" },
  };
}

// ─── Pipeline by Stage (for bar chart) ──────────────────────────────
export interface StageCount {
  stage: string;
  label: string;
  count: number;
}

export async function getPipelineByStage(): Promise<StageCount[]> {
  const results = await db
    .select({ stage: orders.stage, value: count() })
    .from(orders)
    .where(sql`${orders.stage} != 'complete'`)
    .groupBy(orders.stage);

  const map = new Map(results.map((r) => [r.stage, r.value]));

  return STAGES.filter((s) => s !== "complete").map((s) => ({
    stage: s,
    label: STAGE_LABELS[s],
    count: map.get(s) ?? 0,
  }));
}

// ─── Tier Mix (for pie chart) ───────────────────────────────────────
export interface TierCount {
  tier: string;
  count: number;
}

export async function getTierMix(): Promise<TierCount[]> {
  const results = await db
    .select({ tier: orders.tier, value: count() })
    .from(orders)
    .groupBy(orders.tier);

  return results.map((r) => ({ tier: r.tier ?? "T1", count: r.value }));
}

// ─── SLA Table (all active orders, sorted worst-first) ─────────────
export interface SlaTableRow {
  id: string;
  number: string;
  customerName: string | null;
  stage: string;
  stageLabel: string;
  serviceLevel: string;
  tier: string;
  slaStatus: SlaStatus;
  slaPercent: number;
  elapsedHours: number;
  targetHours: number;
}

export async function getSlaTable(): Promise<SlaTableRow[]> {
  const activeOrders = await db
    .select({
      id: orders.id,
      number: orders.number,
      customerName: orders.customerName,
      stage: orders.stage,
      serviceLevel: orders.serviceLevel,
      tier: orders.tier,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .where(sql`${orders.stage} NOT IN ('complete')`);

  const rows: SlaTableRow[] = [];

  for (const o of activeOrders) {
    const targets = SLA_TARGETS[o.stage];
    if (!targets || !o.serviceLevel || !o.updatedAt) continue;
    const targetHours = targets[o.serviceLevel];
    if (!targetHours) continue;

    const elapsed =
      (Date.now() - new Date(o.updatedAt).getTime()) / (1000 * 60 * 60);
    const status = calcSlaStatus(elapsed, targetHours);
    const percent = Math.min((elapsed / targetHours) * 100, 100);

    rows.push({
      id: o.id,
      number: o.number,
      customerName: o.customerName,
      stage: o.stage,
      stageLabel: STAGE_LABELS[o.stage as keyof typeof STAGE_LABELS] ?? o.stage,
      serviceLevel: o.serviceLevel ?? "standard",
      tier: o.tier ?? "T1",
      slaStatus: status,
      slaPercent: percent,
      elapsedHours: elapsed,
      targetHours,
    });
  }

  // Sort worst-first: overdue > at_risk > on_track, then by percent descending
  const priority: Record<string, number> = {
    overdue: 0,
    at_risk: 1,
    on_track: 2,
    complete: 3,
  };
  rows.sort(
    (a, b) =>
      (priority[a.slaStatus] ?? 3) - (priority[b.slaStatus] ?? 3) ||
      b.slaPercent - a.slaPercent
  );

  return rows;
}

// ─── Activity Feed (last 12 timeline events) ────────────────────────
export interface ActivityItem {
  id: string;
  orderNumber: string;
  orderId: string;
  event: string;
  actor: string | null;
  createdAt: Date;
}

export async function getActivityFeed(): Promise<ActivityItem[]> {
  const results = await db
    .select({
      id: orderTimeline.id,
      orderId: orderTimeline.orderId,
      event: orderTimeline.event,
      actor: orderTimeline.actor,
      createdAt: orderTimeline.createdAt,
      orderNumber: orders.number,
    })
    .from(orderTimeline)
    .innerJoin(orders, eq(orderTimeline.orderId, orders.id))
    .orderBy(desc(orderTimeline.createdAt))
    .limit(12);

  return results.map((r) => ({
    id: r.id,
    orderId: r.orderId!,
    orderNumber: r.orderNumber,
    event: r.event,
    actor: r.actor,
    createdAt: r.createdAt!,
  }));
}
