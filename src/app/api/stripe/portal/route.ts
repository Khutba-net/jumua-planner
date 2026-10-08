import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { queryOne } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getOrgContext } from "@/lib/org-context";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId({ skipSubscriptionCheck: true });

    const user = await queryOne<{ stripe_customer_id: string | null }>(
      "SELECT stripe_customer_id FROM users WHERE id = $1",
      [userId]
    );
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const ctx = await getOrgContext(userId);
    let customerId: string | null = null;

    if (ctx) {
      if (ctx.role !== "admin") {
        return NextResponse.json({ error: "Billing is managed by your organization admin" }, { status: 403 });
      }
      const org = await queryOne<{ stripe_customer_id: string }>(
        "SELECT stripe_customer_id FROM organizations WHERE id = $1",
        [ctx.orgId]
      );
      customerId = org?.stripe_customer_id || null;
    } else {
      customerId = user.stripe_customer_id;
    }

    if (!customerId) {
      return NextResponse.json({ error: "No billing account" }, { status: 400 });
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3100";

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    return handleApiError(e);
  }
}
