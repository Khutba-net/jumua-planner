import { queryOne } from "@/lib/db";

export type SubStatus = "active" | "trialing" | "past_due" | "canceled" | "none";

export async function getSubscriptionStatus(userId: string): Promise<{
  status: SubStatus;
  plan: string | null;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
}> {
  const sub = await queryOne<{
    status: string;
    plan: string;
    trial_end: string | null;
    current_period_end: string;
  }>(
    `SELECT status, plan, trial_end, current_period_end
     FROM subscriptions WHERE user_id = $1
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );

  if (!sub) return { status: "none", plan: null, trialEnd: null, currentPeriodEnd: null };

  return {
    status: sub.status as SubStatus,
    plan: sub.plan,
    trialEnd: sub.trial_end,
    currentPeriodEnd: sub.current_period_end,
  };
}

export function hasActiveSubscription(status: SubStatus): boolean {
  return status === "active" || status === "trialing";
}
