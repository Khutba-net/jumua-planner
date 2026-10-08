import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { query, queryOne } from "@/lib/db";
import { stripe, getOrCreateCustomer, getOrCreateOrgCustomer, PLANS, PlanId } from "@/lib/stripe";
import { getOrgContext } from "@/lib/org-context";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId({ skipSubscriptionCheck: true });
    const { plan } = (await req.json()) as { plan: string };

    if (!plan || !(plan in PLANS)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const planId = plan as PlanId;
    const user = await queryOne<{ email: string; name: string }>(
      "SELECT email, name FROM users WHERE id = $1",
      [userId]
    );
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const ctx = await getOrgContext(userId);
    const isOrgPlan = planId === "organization" || planId === "institution";
    let customerId: string;
    let organizationId: string | null = null;

    if (isOrgPlan) {
      if (!ctx || ctx.role !== "admin") {
        return NextResponse.json({ error: "Only org admins can subscribe for an organization" }, { status: 403 });
      }
      organizationId = ctx.orgId;
      customerId = await getOrCreateOrgCustomer(organizationId, user.email, ctx.orgName);
    } else {
      customerId = await getOrCreateCustomer(userId, user.email, user.name);
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3100";

    const metadata: Record<string, string> = { userId, plan: planId };
    if (organizationId) metadata.organizationId = organizationId;

    const hadPriorSub = await queryOne(
      organizationId
        ? "SELECT id FROM subscriptions WHERE organization_id = $1 LIMIT 1"
        : "SELECT id FROM subscriptions WHERE user_id = $1 AND organization_id IS NULL LIMIT 1",
      [organizationId || userId]
    );

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: PLANS[planId].name, tax_code: "txcd_10103001" },
            unit_amount: PLANS[planId].monthlyPrice,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        ...(!hadPriorSub ? { trial_period_days: 14 } : {}),
        metadata,
      },
      success_url: `${origin}/settings?tab=subscription&billing=success`,
      cancel_url: `${origin}/settings?tab=subscription&billing=cancel`,
      metadata,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    return handleApiError(e);
  }
}
