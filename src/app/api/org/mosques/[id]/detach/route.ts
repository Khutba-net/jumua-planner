import { NextResponse } from "next/server";
import { queryOne, query, cuid, withTransaction } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: (e as AuthError).status });
    throw e;
  }

  const { id: mosqueId } = await params;

  const user = await queryOne<{ id: string; organization_id: string | null; role: string }>(
    "SELECT id, organization_id, role FROM users WHERE id = $1",
    [userId]
  );

  if (!user?.organization_id || user.role !== "admin") {
    return NextResponse.json({ error: "Only institution admins can detach mosques" }, { status: 403 });
  }

  const mosque = await queryOne<{ id: string; name: string; admin_user_id: string | null; organization_id: string }>(
    "SELECT id, name, admin_user_id, organization_id FROM mosques WHERE id = $1 AND organization_id = $2",
    [mosqueId, user.organization_id]
  );

  if (!mosque) {
    return NextResponse.json({ error: "Mosque not found" }, { status: 404 });
  }

  const oldOrgId = user.organization_id;

  await withTransaction(async (client) => {
    const newOrgId = cuid();
    await client.query(
      "INSERT INTO organizations (id, name, type) VALUES ($1, $2, 'organization')",
      [newOrgId, mosque.name]
    );

    await client.query(
      "UPDATE mosques SET organization_id = $1, updated_at = NOW() WHERE id = $2",
      [newOrgId, mosqueId]
    );

    if (mosque.admin_user_id) {
      await client.query(
        "UPDATE users SET organization_id = $1, role = 'admin', account_type = 'organization', updated_at = NOW() WHERE id = $2",
        [newOrgId, mosque.admin_user_id]
      );

      await client.query(
        "UPDATE org_members SET organization_id = $1, role = 'admin', updated_at = NOW() WHERE user_id = $2 AND organization_id = $3",
        [newOrgId, mosque.admin_user_id, oldOrgId]
      );
    }

    const mosqueKhatibs = await query<{ id: string; user_id: string | null }>(
      "SELECT id, user_id FROM org_members WHERE organization_id = $1 AND mosque_id = $2 AND role = 'khatib'",
      [oldOrgId, mosqueId]
    );

    for (const khatib of mosqueKhatibs) {
      await client.query(
        "UPDATE org_members SET organization_id = $1, updated_at = NOW() WHERE id = $2",
        [newOrgId, khatib.id]
      );
      if (khatib.user_id) {
        await client.query(
          "UPDATE users SET organization_id = $1, account_type = 'organization', updated_at = NOW() WHERE id = $2",
          [newOrgId, khatib.user_id]
        );
      }
    }

    await client.query(
      "UPDATE friday_assignments SET organization_id = $1 WHERE mosque_id = $2 AND organization_id = $3",
      [newOrgId, mosqueId, oldOrgId]
    );

    await client.query(
      "UPDATE themes SET organization_id = $1 WHERE organization_id = $2 AND id IN (SELECT theme_id FROM sermons WHERE author_id IN (SELECT user_id FROM org_members WHERE organization_id = $1))",
      [newOrgId, oldOrgId]
    );
  });

  if (mosque.admin_user_id) {
    createNotification(
      mosque.admin_user_id,
      "mosque_detached",
      "Mosque detached",
      `${mosque.name} is now a standalone organization. You are the admin.`,
      "/settings"
    ).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
