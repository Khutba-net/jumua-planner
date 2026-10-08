import { NextRequest, NextResponse } from "next/server";
import { getUserId, AuthError } from "@/lib/auth";
import { getOrgContext, getUserMemberships, orgContextCookieOptions } from "@/lib/org-context";
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

  if (orgId && orgId !== "personal") {
    const memberships = await getUserMemberships(userId);
    const isMember = memberships.some((m) => m.orgId === orgId);
    if (!isMember) {
      return NextResponse.json({ error: "Not a member of this organization" }, { status: 403 });
    }
    const res = NextResponse.json(toJSON({ ok: true }));
    res.cookies.set("org_context", orgId, orgContextCookieOptions());
    return res;
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("org_context", "personal", orgContextCookieOptions());
  return res;
}
