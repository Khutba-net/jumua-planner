import { NextResponse } from "next/server";
import { queryOne, query, exec, withTransaction } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function POST() {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }

  const user = await queryOne<{ id: string; organization_id: string | null; role: string; name: string }>(
    "SELECT id, organization_id, role, name FROM users WHERE id = $1",
    [userId]
  );

  if (!user?.organization_id) {
    return NextResponse.json({ error: "Not part of an organization" }, { status: 400 });
  }

  if (user.role === "admin") {
    return NextResponse.json({ error: "Admins must transfer admin role before leaving" }, { status: 400 });
  }

  const orgId = user.organization_id;

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

    await client.query(
      "UPDATE users SET organization_id = NULL, role = 'khatib', account_type = 'individual', updated_at = NOW() WHERE id = $1",
      [userId]
    );
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
      `${user.name} has left the organization.`,
      "/org/khatibs"
    ).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
