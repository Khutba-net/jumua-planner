import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { query } from "@/lib/db";
import { stripe, getOrCreateCustomer, PLANS, PlanId } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const { plan } = (await req.json()) as { plan: string };

    if (!plan || !(plan in PLANS)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const planId = plan as PlanId;
    const user = await query<{ email: string; name: string }>(
      "SELECT email, name FROM users WHERE id = $1",
      [userId]
    );
    if (!user[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const customerId = await getOrCreateCustomer(userId, user[0].email, user[0].name);

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3100";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: PLANS[planId].name },
            unit_amount: PLANS[planId].monthlyPrice,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: { userId, plan: planId },
      },
      success_url: `${origin}/settings?billing=success`,
      cancel_url: `${origin}/settings?billing=cancel`,
      metadata: { userId, plan: planId },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    return handleApiError(e);
  }
}
