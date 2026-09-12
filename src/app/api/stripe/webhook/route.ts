import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { query, exec, cuid } from "@/lib/db";
import { logger } from "@/lib/logger";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error("Webhook signature verification failed", { error: String(err) });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }
  } catch (err) {
    logger.error("Webhook handler error", { type: event.type, error: String(err) });
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function getSubPeriod(sub: Stripe.Subscription) {
  const item = sub.items?.data?.[0];
  return {
    start: item?.current_period_start ?? sub.created,
    end: item?.current_period_end ?? sub.created,
  };
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan || "individual";
  if (!userId || !session.subscription) return;

  const sub = await stripe.subscriptions.retrieve(session.subscription as string);
  const period = getSubPeriod(sub);

  await exec(
    `INSERT INTO subscriptions (id, user_id, stripe_subscription_id, plan, status, current_period_start, current_period_end, trial_end, cancel_at_period_end)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (stripe_subscription_id) DO UPDATE SET
       status = EXCLUDED.status,
       current_period_start = EXCLUDED.current_period_start,
       current_period_end = EXCLUDED.current_period_end,
       trial_end = EXCLUDED.trial_end,
       updated_at = NOW()`,
    [
      cuid(),
      userId,
      sub.id,
      plan,
      sub.status,
      new Date(period.start * 1000).toISOString(),
      new Date(period.end * 1000).toISOString(),
      sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      sub.cancel_at_period_end ? 1 : 0,
    ]
  );

  logger.info("Subscription created from checkout", { userId, plan, subId: sub.id });
}

async function handleSubscriptionChange(sub: Stripe.Subscription) {
  const rows = await query<{ id: string }>(
    "SELECT id FROM subscriptions WHERE stripe_subscription_id = $1",
    [sub.id]
  );
  if (!rows[0]) return;

  const period = getSubPeriod(sub);

  await exec(
    `UPDATE subscriptions SET
       status = $1,
       current_period_start = $2,
       current_period_end = $3,
       cancel_at_period_end = $4,
       trial_end = $5,
       updated_at = NOW()
     WHERE stripe_subscription_id = $6`,
    [
      sub.status,
      new Date(period.start * 1000).toISOString(),
      new Date(period.end * 1000).toISOString(),
      sub.cancel_at_period_end ? 1 : 0,
      sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      sub.id,
    ]
  );

  logger.info("Subscription updated", { subId: sub.id, status: sub.status });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subId = (invoice as unknown as Record<string, unknown>).subscription as string | null;
  if (!subId) return;

  const rows = await query<{ user_id: string }>(
    "SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1",
    [subId]
  );
  if (!rows[0]) return;

  logger.warn("Payment failed", { userId: rows[0].user_id, invoiceId: invoice.id });
}
