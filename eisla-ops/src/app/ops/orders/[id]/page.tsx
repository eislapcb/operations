import { db } from "@/db";
import {
  orders,
  orderAutoReview,
  orderSenseCheck,
  orderEngineerReview,
  orderCustomerApproval,
  orderFiles,
  orderComms,
  orderTimeline,
  orderFeedback,
  customers,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { ROLES, STAGE_LABELS, COMMS_TYPES } from "@/lib/constants";
import { calcOrderSla } from "@/lib/queries";
import { logAccess } from "@/lib/access-log";
import OrderDetailClient from "@/components/orders/OrderDetailClient";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSession();
  const perms = ROLES[user.role];

  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  if (!order) notFound();

  // Log access
  await logAccess(user.id, "view_order", "order", id);

  // Fetch all related data in parallel
  const [
    autoReview,
    senseCheck,
    engReview,
    custApproval,
    files,
    comms,
    timeline,
    feedback,
    allCustomers,
  ] = await Promise.all([
    db.select().from(orderAutoReview).where(eq(orderAutoReview.orderId, id)),
    db.select().from(orderSenseCheck).where(eq(orderSenseCheck.orderId, id)),
    db
      .select()
      .from(orderEngineerReview)
      .where(eq(orderEngineerReview.orderId, id)),
    db
      .select()
      .from(orderCustomerApproval)
      .where(eq(orderCustomerApproval.orderId, id)),
    db.select().from(orderFiles).where(eq(orderFiles.orderId, id)),
    db
      .select()
      .from(orderComms)
      .where(eq(orderComms.orderId, id))
      .orderBy(desc(orderComms.createdAt)),
    db
      .select()
      .from(orderTimeline)
      .where(eq(orderTimeline.orderId, id))
      .orderBy(desc(orderTimeline.createdAt)),
    db.select().from(orderFeedback).where(eq(orderFeedback.orderId, id)),
    perms.canDo && "createOrder" in perms.canDo
      ? db
          .select({
            id: customers.id,
            name: customers.name,
            accountNumber: customers.accountNumber,
            company: customers.company,
          })
          .from(customers)
      : Promise.resolve([]),
  ]);

  const sla = calcOrderSla(
    order.stage,
    order.serviceLevel ?? "standard",
    order.updatedAt ?? order.createdAt ?? new Date()
  );

  return (
    <OrderDetailClient
      order={order}
      autoReview={autoReview[0] ?? null}
      senseCheck={senseCheck[0] ?? null}
      engReview={engReview[0] ?? null}
      custApproval={custApproval[0] ?? null}
      files={files}
      comms={comms}
      timeline={timeline}
      feedback={feedback[0] ?? null}
      sla={sla}
      perms={perms}
      user={user}
      allCustomers={allCustomers}
    />
  );
}
