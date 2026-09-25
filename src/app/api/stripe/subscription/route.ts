import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getEffectiveSubscription } from "@/lib/subscription";
import { queryOne } from "@/lib/db";

export async function GET() {
  try {
    const userId = await getUserId({ skipSubscriptionCheck: true });
    const sub = await getEffectiveSubscription(userId);

    let institutionDetails = null;
    if (sub.plan === "institution" && sub.isOrgManaged) {
      const user = await queryOne<{ organization_id: string | null }>(
        "SELECT organization_id FROM users WHERE id = $1",
        [userId]
      );
      if (user?.organization_id) {
        const org = await queryOne<{
          custom_price_cents: number | null;
          max_mosques: number | null;
          max_khatibs: number | null;
          billing_status: string | null;
          stripe_customer_id: string | null;
        }>(
          "SELECT custom_price_cents, max_mosques, max_khatibs, billing_status, stripe_customer_id FROM organizations WHERE id = $1",
          [user.organization_id]
        );
        if (org) {
          institutionDetails = {
            customPriceCents: org.custom_price_cents,
            maxMosques: org.max_mosques,
            maxKhatibs: org.max_khatibs,
            billingStatus: org.billing_status,
            hasStripeAccount: !!org.stripe_customer_id,
          };
        }
      }
    }

    return NextResponse.json({
      subscription: sub.status === "none" && !sub.isOrgManaged ? null : {
        plan: sub.plan,
        status: sub.status,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        trialEnd: sub.trialEnd,
        isOrgManaged: sub.isOrgManaged,
        orgName: sub.orgName,
        ...(institutionDetails ? { institutionDetails } : {}),
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
