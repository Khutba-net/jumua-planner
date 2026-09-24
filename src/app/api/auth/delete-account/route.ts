import { NextResponse } from "next/server";
import { queryOne, exec, withTransaction } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";
import { sendAccountDeleted } from "@/lib/email";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function DELETE() {
  let userId: string;
  try { userId = await getUserId({ skipSubscriptionCheck: true }); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: (e as AuthError).status });
    throw e;
  }

  const user = await queryOne<{ id: string; email: string; name: string; role: string; organization_id: string | null }>(
    "SELECT id, email, name, role, organization_id FROM users WHERE id = $1", [userId]
  );
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.role === "admin" && user.organization_id) {
    const otherAdmins = await queryOne(
      "SELECT id FROM users WHERE organization_id = $1 AND role = 'admin' AND id != $2 LIMIT 1",
      [user.organization_id, userId]
    );
    if (!otherAdmins) {
      const activeMembers = await queryOne(
        "SELECT id FROM org_members WHERE organization_id = $1 AND status = 'active' AND user_id != $2 LIMIT 1",
        [user.organization_id, userId]
      );
      if (activeMembers) {
        return NextResponse.json(
          { error: "You are the only admin of this organization. Transfer admin role to another member before deleting your account." },
          { status: 400 }
        );
      }
    }
  }

  const userEmail = user.email;
  const userName = user.name;

  await withTransaction(async (client) => {
    await client.query("DELETE FROM sessions WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM email_verification_tokens WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM friday_assignments WHERE member_id IN (SELECT id FROM org_members WHERE user_id = $1)", [userId]);
    await client.query("DELETE FROM org_members WHERE user_id = $1", [userId]);
    await client.query("UPDATE mosques SET admin_user_id = NULL WHERE admin_user_id = $1", [userId]);
    await client.query("DELETE FROM notifications WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM references_ WHERE sermon_id IN (SELECT id FROM sermons WHERE author_id = $1)", [userId]);
    await client.query("DELETE FROM feedback WHERE sermon_id IN (SELECT id FROM sermons WHERE author_id = $1)", [userId]);
    await client.query("UPDATE sermons SET sub_topic_id = NULL WHERE author_id = $1", [userId]);
    await client.query("DELETE FROM sermons WHERE author_id = $1", [userId]);
    await client.query("DELETE FROM sub_topics WHERE theme_id IN (SELECT id FROM themes WHERE owner_id = $1)", [userId]);
    await client.query("DELETE FROM themes WHERE owner_id = $1", [userId]);
    await client.query("DELETE FROM user_settings WHERE user_id = $1", [userId]);

    if (user.role === "admin" && user.organization_id) {
      const remainingMembers = await client.query(
        "SELECT id FROM org_members WHERE organization_id = $1 LIMIT 1",
        [user.organization_id]
      );
      if (remainingMembers.rows.length === 0) {
        await client.query("DELETE FROM friday_assignments WHERE organization_id = $1", [user.organization_id]);
        await client.query("UPDATE mosques SET organization_id = NULL WHERE organization_id = $1", [user.organization_id]);
        await client.query("DELETE FROM subscriptions WHERE organization_id = $1", [user.organization_id]);
        await client.query("DELETE FROM organizations WHERE id = $1", [user.organization_id]);
      }
    }

    await client.query("DELETE FROM users WHERE id = $1", [userId]);
  });

  if (process.env.RESEND_API_KEY) {
    await sendAccountDeleted(userEmail, userName).catch((err) =>
      logger.error("Failed to send account deleted email", { error: String(err) })
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", "", { path: "/", maxAge: 0 });
  res.cookies.set("user_id", "", { path: "/", maxAge: 0 });
  return res;
}
