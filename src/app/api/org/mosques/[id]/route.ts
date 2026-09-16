import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { query, queryOne, exec, toJSON } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";
import { sendMosqueInvitation } from "@/lib/email";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

async function getInstAdmin() {
  const userId = await getUserId();
  const user = await queryOne<{ id: string; organization_id: string | null; role: string; account_type: string; name: string }>(
    "SELECT id, organization_id, role, account_type, name FROM users WHERE id = $1", [userId]
  );
  if (!user?.organization_id || user.role !== "admin" || user.account_type !== "institution") {
    return null;
  }
  return user;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try { user = await getInstAdmin(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }
  if (!user) return NextResponse.json({ error: "Not an institution admin" }, { status: 403 });

  const { id } = await params;
  const mosque = await queryOne(
    "SELECT * FROM mosques WHERE id = $1 AND organization_id = $2",
    [id, user.organization_id]
  );
  if (!mosque) return NextResponse.json({ error: "Mosque not found" }, { status: 404 });

  const members = await query(
    "SELECT id, name, email, role, status, user_id, invite_code, invite_expires_at, created_at FROM org_members WHERE mosque_id = $1 AND organization_id = $2 ORDER BY role = 'admin' DESC, created_at ASC",
    [id, user.organization_id]
  );

  const khatibStats = [];
  for (const m of members.filter((m) => m.role === "khatib" && m.user_id)) {
    const totalRow = await queryOne<{ c: string }>("SELECT COUNT(*) as c FROM sermons WHERE author_id = $1", [m.user_id]);
    const deliveredRow = await queryOne<{ c: string }>("SELECT COUNT(*) as c FROM sermons WHERE author_id = $1 AND status = 'delivered'", [m.user_id]);
    khatibStats.push({
      member_id: m.id,
      name: m.name,
      total_sermons: Number(totalRow?.c ?? 0),
      delivered_sermons: Number(deliveredRow?.c ?? 0),
    });
  }

  return NextResponse.json(toJSON({ mosque, members, khatibStats }));
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try { user = await getInstAdmin(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }
  if (!user) return NextResponse.json({ error: "Not an institution admin" }, { status: 403 });

  const { id } = await params;
  const existing = await queryOne(
    "SELECT id FROM mosques WHERE id = $1 AND organization_id = $2",
    [id, user.organization_id]
  );
  if (!existing) return NextResponse.json({ error: "Mosque not found" }, { status: 404 });

  const body = await req.json();
  const { name, address, city, country, capacity } = body;

  if (name !== undefined && (!name?.trim() || typeof name !== "string")) {
    return NextResponse.json({ error: "Mosque name is required" }, { status: 400 });
  }

  await exec(
    `UPDATE mosques SET
      name = COALESCE($1, name),
      address = COALESCE($2, address),
      city = COALESCE($3, city),
      country = COALESCE($4, country),
      capacity = COALESCE($5, capacity),
      updated_at = NOW()
    WHERE id = $6`,
    [name?.trim()?.slice(0, 200) || null, address?.trim()?.slice(0, 500) || null, city?.trim()?.slice(0, 100) || null, country?.trim()?.slice(0, 100) || null, capacity !== undefined ? Math.max(0, Math.min(Number(capacity), 100000)) : null, id]
  );

  const updated = await queryOne("SELECT * FROM mosques WHERE id = $1", [id]);
  return NextResponse.json(toJSON(updated));
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try { user = await getInstAdmin(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }
  if (!user) return NextResponse.json({ error: "Not an institution admin" }, { status: 403 });

  const { id } = await params;
  const existing = await queryOne(
    "SELECT id FROM mosques WHERE id = $1 AND organization_id = $2",
    [id, user.organization_id]
  );
  if (!existing) return NextResponse.json({ error: "Mosque not found" }, { status: 404 });

  const body = await req.json();
  if (body.action === "unlink") {
    await exec("UPDATE org_members SET mosque_id = NULL WHERE mosque_id = $1", [id]);
    await exec("UPDATE friday_assignments SET mosque_id = NULL WHERE mosque_id = $1", [id]);
    await exec("UPDATE themes SET mosque_id = NULL WHERE mosque_id = $1", [id]);
    await exec("UPDATE mosques SET organization_id = NULL, updated_at = NOW() WHERE id = $1", [id]);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "resend_invite") {
    const mosque = await queryOne<{ id: string; name: string; admin_email: string | null; invite_status: string }>(
      "SELECT id, name, admin_email, invite_status FROM mosques WHERE id = $1", [id]
    );
    if (!mosque?.admin_email) {
      return NextResponse.json({ error: "No admin email set for this mosque" }, { status: 400 });
    }
    if (mosque.invite_status === "accepted") {
      return NextResponse.json({ error: "Invite has already been accepted" }, { status: 400 });
    }
    const newCode = randomBytes(4).toString("hex");
    const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await exec(
      "UPDATE mosques SET invite_code = $1, invite_expires_at = $2, invite_status = 'invited', updated_at = NOW() WHERE id = $3",
      [newCode, newExpiry, id]
    );
    if (process.env.RESEND_API_KEY) {
      const org = await queryOne<{ name: string }>("SELECT name FROM organizations WHERE id = $1", [user!.organization_id]);
      const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3100";
      await sendMosqueInvitation(
        mosque.admin_email,
        user!.name,
        mosque.name,
        org?.name ?? "your institution",
        `${APP_URL}/mosque-invite/${newCode}`
      ).catch((err) => logger.error("Failed to resend mosque invitation", { error: String(err) }));
    }
    const updated = await queryOne("SELECT * FROM mosques WHERE id = $1", [id]);
    return NextResponse.json(toJSON(updated));
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try { user = await getInstAdmin(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }
  if (!user) return NextResponse.json({ error: "Not an institution admin" }, { status: 403 });

  const { id } = await params;
  const existing = await queryOne(
    "SELECT id FROM mosques WHERE id = $1 AND organization_id = $2",
    [id, user.organization_id]
  );
  if (!existing) return NextResponse.json({ error: "Mosque not found" }, { status: 404 });

  const mosque = await queryOne<{ admin_user_id: string | null; name: string }>(
    "SELECT admin_user_id, name FROM mosques WHERE id = $1", [id]
  );

  await exec("UPDATE org_members SET mosque_id = NULL WHERE mosque_id = $1", [id]);
  await exec("DELETE FROM friday_assignments WHERE mosque_id = $1", [id]);

  if (mosque?.admin_user_id) {
    await exec("DELETE FROM org_members WHERE user_id = $1 AND organization_id = $2", [mosque.admin_user_id, user.organization_id]);
    const otherMemberships = await query(
      "SELECT id FROM org_members WHERE user_id = $1", [mosque.admin_user_id]
    );
    if (otherMemberships.length === 0) {
      await exec(
        "UPDATE users SET organization_id = NULL, role = 'khatib', account_type = 'individual', updated_at = NOW() WHERE id = $1",
        [mosque.admin_user_id]
      );
    }
    createNotification(
      mosque.admin_user_id,
      "member_removed",
      "Mosque deleted",
      `${mosque.name} has been deleted by the institution admin. Your account is now individual.`,
      "/settings"
    ).catch(() => {});
  }

  await exec("DELETE FROM mosques WHERE id = $1", [id]);

  return NextResponse.json({ ok: true });
}
