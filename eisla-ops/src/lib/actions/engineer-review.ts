"use server";

import { db } from "@/db";
import { orders, orderEngineerReview, orderTimeline } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";

export async function submitEngineerReview(
  orderId: string,
  outcome: string,
  comments: string
) {
  const user = await requireSession();

  await db
    .insert(orderEngineerReview)
    .values({
      orderId,
      engineerId: user.id,
      sentAt: new Date(),
      completedAt: new Date(),
      outcome,
      comments,
    })
    .onConflictDoUpdate({
      target: orderEngineerReview.orderId,
      set: {
        engineerId: user.id,
        completedAt: new Date(),
        outcome,
        comments,
      },
    });

  await db.insert(orderTimeline).values({
    orderId,
    event: `Engineer review completed: ${outcome}`,
    actor: user.name,
  });

  // If approved, advance to customer_approval
  if (outcome === "approved") {
    await db
      .update(orders)
      .set({ stage: "customer_approval", updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    await db.insert(orderTimeline).values({
      orderId,
      event: "Stage advanced to customer_approval",
      actor: user.name,
    });
  }

  revalidatePath("/reviews");
}
