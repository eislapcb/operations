import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export async function createCheckoutSession(
  orderId: string,
  orderNumber: string,
  amountPence: number,
  customerEmail: string | null
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: {
            name: `Eisla PCB Design Fee — ${orderNumber}`,
          },
          unit_amount: amountPence,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/ops/orders/${orderId}?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/ops/orders/${orderId}?payment=cancelled`,
    metadata: {
      order_id: orderId,
    },
    ...(customerEmail ? { customer_email: customerEmail } : {}),
  });

  return session.url!;
}
