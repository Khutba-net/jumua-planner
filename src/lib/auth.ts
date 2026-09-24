import { cookies } from "next/headers";
import { verifySession, deleteSession } from "@/lib/session";
import { queryOne } from "@/lib/db";

export async function getUserId(opts?: { skipSubscriptionCheck?: boolean }): Promise<string> {
  const cookieStore = await cookies();

  const token = cookieStore.get("session")?.value;
  if (token) {
    const userId = await verifySession(token);
    if (userId) {
      const deactivated = await queryOne(
        "SELECT id FROM org_members WHERE user_id = $1 AND status = 'deactivated'",
        [userId]
      );
      if (deactivated) {
        await deleteSession(token);
        throw new AuthError("Account deactivated");
      }
      if (!opts?.skipSubscriptionCheck) {
        await requireSubscription(userId);
      }
      return userId;
    }
  }

  throw new AuthError("Not authenticated");
}

export class AuthError extends Error {
  public status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export class SubscriptionError extends AuthError {
  constructor() {
    super("Active subscription required", 403);
    this.name = "SubscriptionError";
  }
}

export async function requireSubscription(userId: string): Promise<void> {
  const { getEffectiveSubscription } = await import("@/lib/subscription");
  const sub = await getEffectiveSubscription(userId);
  if (sub.status !== "active" && sub.status !== "trialing") {
    const user = await queryOne<{ is_platform_admin: number }>(
      "SELECT is_platform_admin FROM users WHERE id = $1", [userId]
    );
    if (user?.is_platform_admin === 1) return;
    throw new SubscriptionError();
  }
}
