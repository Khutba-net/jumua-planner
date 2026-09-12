import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { queryOne } from "@/lib/db";

export async function GET() {
  try {
    const userId = await getUserId();

    const sub = await queryOne<{
      plan: string;
      status: string;
      current_period_end: string;
      cancel_at_period_end: number;
      trial_end: string | null;
    }>(
      `SELECT plan, status, current_period_end, cancel_at_period_end, trial_end
       FROM subscriptions WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (!sub) {
      return NextResponse.json({ subscription: null });
    }

    return NextResponse.json({
      subscription: {
        plan: sub.plan,
        status: sub.status,
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: !!sub.cancel_at_period_end,
        trialEnd: sub.trial_end,
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
