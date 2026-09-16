import { queryOne } from "@/lib/db";

export type SubStatus = "active" | "trialing" | "past_due" | "canceled" | "none";

export interface EffectiveSubscription {
  status: SubStatus;
  plan: string | null;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isOrgManaged: boolean;
  orgName: string | null;
}

export async function getSubscriptionStatus(userId: string): Promise<{
  status: SubStatus;
  plan: string | null;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}> {
  const sub = await queryOne<{
    status: string;
    plan: string;
    trial_end: string | null;
    current_period_end: string;
    cancel_at_period_end: number;
  }>(
    `SELECT status, plan, trial_end, current_period_end, cancel_at_period_end
     FROM subscriptions WHERE user_id = $1
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );

  if (!sub) return { status: "none", plan: null, trialEnd: null, currentPeriodEnd: null, cancelAtPeriodEnd: false };

  return {
    status: sub.status as SubStatus,
    plan: sub.plan,
    trialEnd: sub.trial_end,
    currentPeriodEnd: sub.current_period_end,
    cancelAtPeriodEnd: !!sub.cancel_at_period_end,
  };
}

export async function getEffectiveSubscription(userId: string): Promise<EffectiveSubscription> {
  const user = await queryOne<{
    organization_id: string | null;
    account_type: string;
    role: string;
  }>(
    "SELECT organization_id, account_type, role FROM users WHERE id = $1",
    [userId]
  );

  if (!user) {
    return { status: "none", plan: null, trialEnd: null, currentPeriodEnd: null, cancelAtPeriodEnd: false, isOrgManaged: false, orgName: null };
  }

  const isOrgUser = user.organization_id && (user.account_type === "organization" || user.account_type === "institution");

  if (isOrgUser) {
    const orgSub = await queryOne<{
      status: string;
      plan: string;
      trial_end: string | null;
      current_period_end: string;
      cancel_at_period_end: number;
      org_name: string;
    }>(
      `SELECT s.status, s.plan, s.trial_end, s.current_period_end, s.cancel_at_period_end, o.name as org_name
       FROM subscriptions s
       JOIN organizations o ON o.id = s.organization_id
       WHERE s.organization_id = $1
       ORDER BY s.created_at DESC LIMIT 1`,
      [user.organization_id]
    );

    if (orgSub) {
      return {
        status: orgSub.status as SubStatus,
        plan: orgSub.plan,
        trialEnd: orgSub.trial_end,
        currentPeriodEnd: orgSub.current_period_end,
        cancelAtPeriodEnd: !!orgSub.cancel_at_period_end,
        isOrgManaged: true,
        orgName: orgSub.org_name,
      };
    }

    const orgName = await queryOne<{ name: string }>(
      "SELECT name FROM organizations WHERE id = $1",
      [user.organization_id]
    );

    return {
      status: "none",
      plan: null,
      trialEnd: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      isOrgManaged: true,
      orgName: orgName?.name || null,
    };
  }

  const sub = await getSubscriptionStatus(userId);
  return { ...sub, isOrgManaged: false, orgName: null };
}

export function hasActiveSubscription(status: SubStatus): boolean {
  return status === "active" || status === "trialing";
}
