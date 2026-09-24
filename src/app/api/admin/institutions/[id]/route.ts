import { NextRequest, NextResponse } from "next/server";
import { queryOne, query, exec, cuid } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/admin";
import { logger } from "@/lib/logger";
import { stripe, getOrCreateOrgCustomer } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePlatformAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const org = await queryOne<Record<string, unknown>>(
    `SELECT o.*,
      (SELECT COUNT(*) FROM mosques m WHERE m.organization_id = o.id)::int AS mosque_count,
      (SELECT COUNT(*) FROM org_members om WHERE om.organization_id = o.id)::int AS member_count
    FROM organizations o WHERE o.id = $1`,
    [id]
  );

  if (!org) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const mosques = await import("@/lib/db").then((db) =>
    db.query<{ id: string; name: string; city: string | null; capacity: number | null }>(
      "SELECT id, name, city, capacity FROM mosques WHERE organization_id = $1 ORDER BY name",
      [id]
    )
  );

  const members = await import("@/lib/db").then((db) =>
    db.query<{ id: string; user_id: string; role: string; name: string; email: string }>(
      `SELECT om.id, om.user_id, om.role, u.name, u.email
       FROM org_members om JOIN users u ON u.id = om.user_id
       WHERE om.organization_id = $1 ORDER BY om.role, u.name`,
      [id]
    )
  );

  return NextResponse.json({ institution: org, mosques, members });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePlatformAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { max_mosques, max_khatibs, custom_price_cents, billing_notes, billing_status } = body;

  const org = await queryOne<{ id: string }>(
    "SELECT id FROM organizations WHERE id = $1",
    [id]
  );
  if (!org) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await exec(
    `UPDATE organizations SET
      max_mosques = COALESCE($1, max_mosques),
      max_khatibs = COALESCE($2, max_khatibs),
      custom_price_cents = COALESCE($3, custom_price_cents),
      billing_notes = COALESCE($4, billing_notes),
      billing_status = COALESCE($5, billing_status),
      updated_at = NOW()
    WHERE id = $6`,
    [
      max_mosques ?? null,
      max_khatibs ?? null,
      custom_price_cents ?? null,
      billing_notes ?? null,
      billing_status ?? null,
      id,
    ]
  );

  // When billing_status changes to active/trial, create or update subscription row
  if (billing_status === "active" || billing_status === "trial") {
    const existingSub = await queryOne<{ id: string }>(
      "SELECT id FROM subscriptions WHERE organization_id = $1 LIMIT 1",
      [id]
    );

    const orgData = await queryOne<{ type: string }>(
      "SELECT type FROM organizations WHERE id = $1", [id]
    );
    const plan = orgData?.type === "institution" ? "institution" : "organization";
    const status = billing_status === "trial" ? "trialing" : "active";
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    if (existingSub) {
      await exec(
        `UPDATE subscriptions SET status = $1, plan = $2, current_period_start = NOW(), current_period_end = $3, updated_at = NOW() WHERE id = $4`,
        [status, plan, periodEnd.toISOString(), existingSub.id]
      );
    } else {
      // Find the admin user for user_id
      const admin = await queryOne<{ user_id: string }>(
        "SELECT user_id FROM org_members WHERE organization_id = $1 AND role = 'admin' LIMIT 1",
        [id]
      );
      await exec(
        `INSERT INTO subscriptions (id, user_id, stripe_subscription_id, plan, status, current_period_start, current_period_end, organization_id)
         VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)`,
        [cuid(), admin?.user_id || null, `manual_${id}`, plan, status, periodEnd.toISOString(), id]
      );
    }
    logger.info("Admin: activated subscription for org", { id, status, plan });
  } else if (billing_status === "cancelled") {
    await exec(
      "UPDATE subscriptions SET status = 'canceled', updated_at = NOW() WHERE organization_id = $1 AND status IN ('active', 'trialing')",
      [id]
    );
    logger.info("Admin: cancelled subscription for org", { id });
  }

  logger.info("Admin: updated institution", { id, ...body });

  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePlatformAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  if (action === "create_stripe_subscription") {
    const org = await queryOne<{ id: string; name: string; custom_price_cents: number | null; type: string; stripe_customer_id: string | null }>(
      "SELECT id, name, custom_price_cents, type, stripe_customer_id FROM organizations WHERE id = $1",
      [id]
    );
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });
    if (!org.custom_price_cents) return NextResponse.json({ error: "Set a custom price first" }, { status: 400 });

    const admin = await queryOne<{ user_id: string; email: string }>(
      `SELECT om.user_id, u.email FROM org_members om JOIN users u ON u.id = om.user_id
       WHERE om.organization_id = $1 AND om.role = 'admin' LIMIT 1`,
      [id]
    );
    if (!admin) return NextResponse.json({ error: "No admin found for this org" }, { status: 400 });

    // Check for existing active Stripe subscription
    const existingSub = await queryOne<{ stripe_subscription_id: string }>(
      "SELECT stripe_subscription_id FROM subscriptions WHERE organization_id = $1 AND status IN ('active', 'trialing') LIMIT 1",
      [id]
    );
    if (existingSub && !existingSub.stripe_subscription_id.startsWith("manual_")) {
      return NextResponse.json({ error: "Already has an active Stripe subscription" }, { status: 400 });
    }

    const customerId = await getOrCreateOrgCustomer(id, admin.email, org.name);

    const plan = org.type === "institution" ? "institution" : "organization";

    const price = await stripe.prices.create({
      currency: "usd",
      unit_amount: org.custom_price_cents,
      recurring: { interval: "month" },
      product_data: { name: `${org.name} — ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan` },
    });

    const sub = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      collection_method: "send_invoice",
      days_until_due: 30,
      metadata: { organizationId: id, plan },
    });

    // The webhook will handle creating/updating the subscription row
    // But also update billing_status on the org
    await exec(
      "UPDATE organizations SET billing_status = 'invoice_sent', updated_at = NOW() WHERE id = $1",
      [id]
    );

    logger.info("Admin: created Stripe subscription for org", { id, subId: sub.id, price: org.custom_price_cents });

    return NextResponse.json({ ok: true, subscriptionId: sub.id });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
