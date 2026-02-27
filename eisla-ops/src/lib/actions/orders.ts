"use server";

import { db } from "@/db";
import {
  orders,
  orderTimeline,
  orderComms,
  orderAutoReview,
  customers,
} from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import {
  STAGES,
  TIER_PRICES,
  SERVICE_SURCHARGES,
  REVIEW_CHECKLIST,
} from "@/lib/constants";
import { logAccess } from "@/lib/access-log";

// ─── Create Order ───────────────────────────────────────────────────
export async function createOrder(formData: FormData) {
  const user = await requireSession();
  if (user.role !== "admin") throw new Error("Unauthorized");

  // Generate order number: EISLA-YYYY-NNNN
  const year = new Date().getFullYear();
  const [countResult] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(orders);
  const seq = String((countResult?.value ?? 0) + 1).padStart(4, "0");
  const number = `EISLA-${year}-${seq}`;

  const description = formData.get("description") as string;
  const tier = formData.get("tier") as string;
  const serviceLevel = formData.get("serviceLevel") as string;
  const customerId = formData.get("customerId") as string;

  // Calculate fee
  const baseFee = TIER_PRICES[tier] ?? TIER_PRICES.T1;
  const surcharge = SERVICE_SURCHARGES[serviceLevel] ?? 0;
  const fee = baseFee + surcharge;

  // If customer selected, sync denormalized fields
  let customerFields: Record<string, string | null> = {};
  if (customerId) {
    const [cust] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId));
    if (cust) {
      customerFields = {
        customerName: cust.name,
        email: cust.email,
        phone: cust.phone,
        company: cust.company,
        delAddr1: cust.addr1,
        delAddr2: cust.addr2,
        delCity: cust.city,
        delCounty: cust.county,
        delPostcode: cust.postcode,
        delCountry: cust.country,
      };
    }
  }

  const [newOrder] = await db
    .insert(orders)
    .values({
      number,
      description,
      tier,
      serviceLevel,
      fee,
      customerId: customerId || null,
      ...customerFields,
    })
    .returning({ id: orders.id });

  // Timeline
  await db.insert(orderTimeline).values({
    orderId: newOrder.id,
    event: `Order created (${tier}, ${serviceLevel})`,
    actor: user.name,
  });

  revalidatePath("/ops");
  revalidatePath("/ops/pipeline");
  return { id: newOrder.id };
}

// ─── Advance Stage ──────────────────────────────────────────────────
export async function advanceStage(orderId: string) {
  const user = await requireSession();
  if (user.role !== "admin") throw new Error("Unauthorized");

  const [order] = await db
    .select({ stage: orders.stage, tier: orders.tier })
    .from(orders)
    .where(eq(orders.id, orderId));

  if (!order) throw new Error("Order not found");

  const currentIdx = STAGES.indexOf(order.stage as any);
  if (currentIdx === -1 || currentIdx >= STAGES.length - 1) {
    throw new Error("Cannot advance past final stage");
  }

  let nextIdx = currentIdx + 1;

  // Skip engineer_review for T1 orders
  if (STAGES[nextIdx] === "engineer_review" && order.tier === "T1") {
    nextIdx++;
  }

  const nextStage = STAGES[nextIdx];

  // If entering auto_review, generate automatic review results
  if (nextStage === "auto_review") {
    const checks = REVIEW_CHECKLIST.map((item) => ({
      item,
      result: "pass",
    }));
    await db
      .insert(orderAutoReview)
      .values({
        orderId,
        checks,
        result: "pass",
        completedAt: new Date(),
      })
      .onConflictDoNothing();
  }

  await db
    .update(orders)
    .set({ stage: nextStage, updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  // Set app context for field_changes trigger
  await db.execute(sql`SELECT set_config('app.current_user_id', ${user.id}, true)`);

  await db.insert(orderTimeline).values({
    orderId,
    event: `Stage advanced to ${nextStage}`,
    actor: user.name,
  });

  revalidatePath("/ops");
  revalidatePath("/ops/pipeline");
  revalidatePath(`/ops/orders/${orderId}`);
}

// ─── Update Order Fields ────────────────────────────────────────────
export async function updateOrder(orderId: string, formData: FormData) {
  const user = await requireSession();
  if (user.role !== "admin") throw new Error("Unauthorized");

  // Set app context for field_changes trigger
  await db.execute(sql`SELECT set_config('app.current_user_id', ${user.id}, true)`);

  const updates: Record<string, unknown> = {};
  const fields = [
    "description",
    "tier",
    "serviceLevel",
    "notes",
    "fab",
    "fabRef",
    "fabCost",
    "tracking",
    "carrier",
    "delAddr1",
    "delAddr2",
    "delCity",
    "delCounty",
    "delPostcode",
    "delCountry",
    "delInstructions",
    "mfgEstimate",
  ];

  for (const field of fields) {
    const value = formData.get(field);
    if (value !== null) {
      updates[field] =
        ["fabCost", "mfgEstimate"].includes(field) && value
          ? parseInt(value as string, 10)
          : value;
    }
  }

  // Recalculate fee if tier or service level changed
  if (updates.tier || updates.serviceLevel) {
    const [current] = await db
      .select({ tier: orders.tier, serviceLevel: orders.serviceLevel })
      .from(orders)
      .where(eq(orders.id, orderId));
    const tier = (updates.tier as string) ?? current?.tier ?? "T1";
    const sl = (updates.serviceLevel as string) ?? current?.serviceLevel ?? "standard";
    updates.fee = (TIER_PRICES[tier] ?? TIER_PRICES.T1) + (SERVICE_SURCHARGES[sl] ?? 0);
  }

  if (Object.keys(updates).length > 0) {
    await db.update(orders).set(updates).where(eq(orders.id, orderId));
  }

  revalidatePath(`/ops/orders/${orderId}`);
}

// ─── Link Customer ──────────────────────────────────────────────────
export async function linkCustomer(orderId: string, customerId: string) {
  const user = await requireSession();
  if (user.role !== "admin") throw new Error("Unauthorized");

  const [cust] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId));
  if (!cust) throw new Error("Customer not found");

  await db
    .update(orders)
    .set({
      customerId,
      customerName: cust.name,
      email: cust.email,
      phone: cust.phone,
      company: cust.company,
      delAddr1: cust.addr1,
      delAddr2: cust.addr2,
      delCity: cust.city,
      delCounty: cust.county,
      delPostcode: cust.postcode,
      delCountry: cust.country,
    })
    .where(eq(orders.id, orderId));

  await db.insert(orderTimeline).values({
    orderId,
    event: `Customer linked: ${cust.name} (${cust.accountNumber})`,
    actor: user.name,
  });

  revalidatePath(`/ops/orders/${orderId}`);
}

// ─── Add Communication ─────────────────────────────────────────────
export async function addComms(orderId: string, formData: FormData) {
  const user = await requireSession();
  if (user.role !== "admin") throw new Error("Unauthorized");

  const type = formData.get("type") as string;
  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;

  await db.insert(orderComms).values({
    orderId,
    type,
    subject,
    body,
    byUserId: user.id,
  });

  // Also create timeline event
  await db.insert(orderTimeline).values({
    orderId,
    event: `Communication logged: ${type} — ${subject}`,
    actor: user.name,
  });

  revalidatePath(`/ops/orders/${orderId}`);
}

// ─── Generate Quote ─────────────────────────────────────────────────
export async function generateQuote(orderId: string) {
  const user = await requireSession();
  if (user.role !== "admin") throw new Error("Unauthorized");

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));
  if (!order) throw new Error("Order not found");

  const year = new Date().getFullYear();
  const quoteRef = `Q-${year}-${order.number.split("-").pop()}`;
  const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db
    .update(orders)
    .set({ quoteRef, quoteSentAt: new Date() })
    .where(eq(orders.id, orderId));

  // Log as comms
  await db.insert(orderComms).values({
    orderId,
    type: "quote",
    subject: `Quote ${quoteRef} sent`,
    body: `Quote generated: ${quoteRef}. Fee: £${((order.fee ?? 0) / 100).toFixed(2)}. Expires: ${expiry.toLocaleDateString("en-GB")}.`,
    byUserId: user.id,
  });

  // Timeline
  await db.insert(orderTimeline).values({
    orderId,
    event: `Quote sent: ${quoteRef}`,
    actor: user.name,
  });

  revalidatePath(`/ops/orders/${orderId}`);
  return { quoteRef };
}
