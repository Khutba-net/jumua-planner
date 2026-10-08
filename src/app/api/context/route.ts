import { NextRequest, NextResponse } from "next/server";
import { getUserId, AuthError } from "@/lib/auth";
import { getOrgContext, getUserMemberships, orgContextCookieOptions } from "@/lib/org-context";
import { getEffectiveSubscription } from "@/lib/subscription";
import { toJSON } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let userId: string;
  try { userId = await getUserId({ skipSubscriptionCheck: true }); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: (e as AuthError).status });
    throw e;
  }

  const context = await getOrgContext(userId);
  const memberships = await getUserMemberships(userId);

  return NextResponse.json(toJSON({ context, memberships }));
}

export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId({ skipSubscriptionCheck: true }); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: (e as AuthError).status });
    throw e;
  }

  const { orgId } = await req.json();
  const res = NextResponse.json({ ok: true });
  res.cookies.set("org_context", orgId || "personal", orgContextCookieOptions());

  if (orgId && orgId !== "personal") {
    const context = await getOrgContext(userId);
    if (!context) {
      return NextResponse.json({ error: "Not a member of this organization" }, { status: 403 });
    }
    const sub = await getEffectiveSubscription(userId, orgId);
    return NextResponse.json(toJSON({ context, subscription: sub }));
  }

  return res;
}
