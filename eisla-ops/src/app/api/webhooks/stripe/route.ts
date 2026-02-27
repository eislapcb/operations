import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import { orders, orderTimeline } from "@/db/schema";
import { eq } from "drizzle-orm";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;
  const stripe = getStripe();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;

    if (orderId) {
      await db
        .update(orders)
        .set({
          paymentStatus: "Paid",
          stripeSessionId: session.id,
          stripePaymentIntent: session.payment_intent as string,
          stripeAmount: session.amount_total,
          paymentDate: new Date(),
          // Auto-advance from quoted → accepted
          stage: "accepted",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      await db.insert(orderTimeline).values({
        orderId,
        event: `Payment received via Stripe (£${((session.amount_total ?? 0) / 100).toFixed(2)})`,
        actor: "System",
      });

      await db.insert(orderTimeline).values({
        orderId,
        event: "Stage advanced to accepted (auto — payment received)",
        actor: "System",
      });
    }
  }

  return NextResponse.json({ received: true });
}
