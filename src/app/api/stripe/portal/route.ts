import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { queryOne } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();

    const user = await queryOne<{ role: string; organization_id: string | null; account_type: string; stripe_customer_id: string | null }>(
      "SELECT role, organization_id, account_type, stripe_customer_id FROM users WHERE id = $1",
      [userId]
    );
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isOrgUser = user.organization_id && (user.account_type === "organization" || user.account_type === "institution");
    let customerId: string | null = null;

    if (isOrgUser) {
      if (user.role !== "admin") {
        return NextResponse.json({ error: "Billing is managed by your organization admin" }, { status: 403 });
      }
      const org = await queryOne<{ stripe_customer_id: string }>(
        "SELECT stripe_customer_id FROM organizations WHERE id = $1",
        [user.organization_id]
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
