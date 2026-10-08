import { NextResponse } from "next/server";
import { queryOne, query, withTransaction } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { requireOrgContext, OrgContextError, getUserMemberships } from "@/lib/org-context";

export async function POST() {
  let userId: string;
  try { userId = await getUserId({ skipSubscriptionCheck: true }); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: (e as AuthError).status });
    throw e;
  }

  let ctx;
  try { ctx = await requireOrgContext(userId); } catch (e) {
    if (e instanceof OrgContextError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }

  if (ctx.role === "admin") {
    return NextResponse.json({ error: "Admins must transfer admin role before leaving" }, { status: 400 });
  }

  const user = await queryOne<{ name: string }>("SELECT name FROM users WHERE id = $1", [userId]);
  const orgId = ctx.orgId;

  await withTransaction(async (client) => {
    const member = await queryOne<{ id: string }>(
      "SELECT id FROM org_members WHERE user_id = $1 AND organization_id = $2",
      [userId, orgId]
    );

    if (member) {
      const today = new Date().toISOString().split("T")[0];
      await client.query(
        "DELETE FROM friday_assignments WHERE member_id = $1 AND friday_date >= $2",
        [member.id, today]
      );
      await client.query("DELETE FROM org_members WHERE id = $1", [member.id]);
    }

    // Check if user has other memberships — if not, reset to individual
    const remaining = await getUserMemberships(userId);
    if (remaining.filter((m) => m.orgId !== orgId).length === 0) {
      await client.query(
        "UPDATE users SET organization_id = NULL, role = 'khatib', account_type = 'individual', updated_at = NOW() WHERE id = $1",
        [userId]
      );
    } else if ((await queryOne<{ organization_id: string | null }>("SELECT organization_id FROM users WHERE id = $1", [userId]))?.organization_id === orgId) {
      // If leaving the org that's on users.organization_id, clear it
      await client.query(
        "UPDATE users SET organization_id = NULL, updated_at = NOW() WHERE id = $1",
        [userId]
      );
    }
  });

  const admins = await query<{ user_id: string }>(
    "SELECT user_id FROM org_members WHERE organization_id = $1 AND role = 'admin' AND user_id IS NOT NULL",
    [orgId]
  );
  for (const admin of admins) {
    createNotification(
      admin.user_id,
      "khatib_left",
      "Member left",
      `${user?.name ?? "A member"} has left the organization.`,
      "/org/khatibs"
    ).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
