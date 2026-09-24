import { NextResponse } from "next/server";
import { queryOne, toJSON } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";
import { getEffectiveSubscription } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export async function GET() {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }

  const user = await queryOne<Record<string, unknown>>(
    "SELECT id, name, email, account_type, role, organization_id, avatar_url, onboarding_complete, is_platform_admin FROM users WHERE id = $1",
    [userId]
  );
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  if (!user.onboarding_complete) {
    return NextResponse.json({ error: "Onboarding incomplete", onboarding: false }, { status: 403 });
  }

  const subscription = await getEffectiveSubscription(userId);

  return NextResponse.json(toJSON({ user, subscription }));
}
