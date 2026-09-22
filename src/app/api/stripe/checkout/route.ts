import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { query, queryOne } from "@/lib/db";
import { stripe, getOrCreateCustomer, getOrCreateOrgCustomer, PLANS, PlanId } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const { plan } = (await req.json()) as { plan: string };

    if (!plan || !(plan in PLANS)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const planId = plan as PlanId;
    const user = await queryOne<{ email: string; name: string; account_type: string; role: string; organization_id: string | null }>(
      "SELECT email, name, account_type, role, organization_id FROM users WHERE id = $1",
      [userId]
    );
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isOrgPlan = planId === "organization" || planId === "institution";
    let customerId: string;
    let organizationId: string | null = null;

    if (isOrgPlan) {
      if (user.role !== "admin") {
        return NextResponse.json({ error: "Only admins can subscribe for an organization" }, { status: 403 });
      }
      if (!user.organization_id) {
        return NextResponse.json({ error: "No organization found" }, { status: 400 });
      }
      organizationId = user.organization_id;
      const org = await queryOne<{ name: string }>(
        "SELECT name FROM organizations WHERE id = $1",
        [organizationId]
      );
      customerId = await getOrCreateOrgCustomer(organizationId, user.email, org?.name || "Organization");
    } else {
      customerId = await getOrCreateCustomer(userId, user.email, user.name);
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3100";

    const metadata: Record<string, string> = { userId, plan: planId };
    if (organizationId) metadata.organizationId = organizationId;

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
        trial_period_days: 14,
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
