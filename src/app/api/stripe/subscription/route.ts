import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getEffectiveSubscription } from "@/lib/subscription";

export async function GET() {
  try {
    const userId = await getUserId();
    const sub = await getEffectiveSubscription(userId);

    return NextResponse.json({
      subscription: sub.status === "none" && !sub.isOrgManaged ? null : {
        plan: sub.plan,
        status: sub.status,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        trialEnd: sub.trialEnd,
        isOrgManaged: sub.isOrgManaged,
        orgName: sub.orgName,
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
