"use server";

import { db } from "@/db";
import { orders, orderSenseCheck, orderTimeline, exceptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { STAGES } from "@/lib/constants";

export async function submitSenseCheck(
  orderId: string,
  approved: boolean,
  notes: string
) {
  const user = await requireSession();
  if (user.role !== "admin") throw new Error("Unauthorized");

  await db
    .insert(orderSenseCheck)
    .values({
      orderId,
      approved,
      byUserId: user.id,
      notes,
      completedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: orderSenseCheck.orderId,
      set: { approved, byUserId: user.id, notes, completedAt: new Date() },
    });

  await db.insert(orderTimeline).values({
    orderId,
    event: `Sense check: ${approved ? "Approved" : "Flagged"}${notes ? ` — ${notes}` : ""}`,
    actor: user.name,
  });

  if (approved) {
    // Auto-advance to next stage
    const [order] = await db
      .select({ tier: orders.tier })
      .from(orders)
      .where(eq(orders.id, orderId));

    // Skip engineer_review for T1
    const nextStage =
      order?.tier === "T1" ? "customer_approval" : "engineer_review";

    await db
      .update(orders)
      .set({ stage: nextStage, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    await db.insert(orderTimeline).values({
      orderId,
      event: `Stage advanced to ${nextStage}`,
      actor: user.name,
    });
  } else {
    // Create exception
    await db.insert(exceptions).values({
      orderId,
      type: "sense_check_failed",
      description: notes || "Sense check flagged",
    });
  }

  revalidatePath("/ops/sense-check");
  revalidatePath("/ops");
}

export async function resolveException(exceptionId: string) {
  const user = await requireSession();
  if (user.role !== "admin") throw new Error("Unauthorized");

  await db
    .update(exceptions)
    .set({
      resolved: true,
      resolvedBy: user.name,
      resolvedAt: new Date(),
    })
    .where(eq(exceptions.id, exceptionId));

  revalidatePath("/ops/exceptions");
  revalidatePath("/ops");
}
