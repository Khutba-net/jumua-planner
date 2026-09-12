import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { query } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();

    const rows = await query<{ stripe_customer_id: string }>(
      "SELECT stripe_customer_id FROM users WHERE id = $1",
      [userId]
    );

    if (!rows[0]?.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account" }, { status: 400 });
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3100";

    const session = await stripe.billingPortal.sessions.create({
      customer: rows[0].stripe_customer_id,
      return_url: `${origin}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    return handleApiError(e);
  }
}
