import { NextResponse } from "next/server";
import { query, queryOne, cuid, toJSON, hashPassword, verifyPassword, withTransaction } from "@/lib/db";
import { createSession, sessionCookieOptions } from "@/lib/session";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { code } = await params;

  const mosque = await queryOne<{ id: string; name: string; admin_email: string | null; invite_status: string; invite_expires_at: string; org_name: string; org_id: string }>(
    `SELECT m.id, m.name, m.admin_email, m.invite_status, m.invite_expires_at, o.name as org_name, o.id as org_id
     FROM mosques m JOIN organizations o ON o.id = m.organization_id
     WHERE m.invite_code = $1`,
    [code]
  );

  if (!mosque) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
  }

  if (mosque.invite_status === "accepted") {
    return NextResponse.json({ error: "This invite has already been used" }, { status: 410 });
  }

  if (mosque.invite_expires_at && new Date(mosque.invite_expires_at) < new Date()) {
    return NextResponse.json({ error: "This invite has expired" }, { status: 410 });
  }

  return NextResponse.json({
    mosque_name: mosque.name,
    org_name: mosque.org_name,
    admin_email: mosque.admin_email || undefined,
  });
}

export async function POST(req: Request, { params }: Params) {
  const { code } = await params;
  const body = await req.json();
  const { name, email: rawEmail, password } = body as { name?: string; email?: string; password?: string };

  if (!rawEmail || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }
  const email = rawEmail.toLowerCase().trim();

  const mosque = await queryOne<{ id: string; name: string; invite_status: string; organization_id: string; invite_expires_at: string }>(
    "SELECT id, name, invite_status, organization_id, invite_expires_at FROM mosques WHERE invite_code = $1",
    [code]
  );

  if (!mosque) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
  }

  if (mosque.invite_status === "accepted") {
    return NextResponse.json({ error: "This invite has already been used" }, { status: 410 });
  }

  if (mosque.invite_expires_at && new Date(mosque.invite_expires_at) < new Date()) {
    return NextResponse.json({ error: "This invite has expired" }, { status: 410 });
  }

  const existing = await queryOne<{ id: string; password_hash: string | null; name: string }>(
    "SELECT id, password_hash, name FROM users WHERE LOWER(email) = $1", [email]
  );

  let userId: string;

  if (existing) {
    if (!existing.password_hash || !verifyPassword(password, existing.password_hash)) {
      return NextResponse.json({ error: "Incorrect password for existing account" }, { status: 401 });
    }
    userId = existing.id;
    await withTransaction(async (client) => {
      await client.query(
        "UPDATE mosques SET admin_user_id = $1, admin_email = $2, invite_status = 'accepted', updated_at = NOW() WHERE id = $3",
        [userId, email, mosque.id]
      );
      const memberId = cuid();
      await client.query(
        `INSERT INTO org_members (id, organization_id, mosque_id, user_id, name, email, role, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'mosque_admin', 'active')
         ON CONFLICT DO NOTHING`,
        [memberId, mosque.organization_id, mosque.id, userId, existing.name, email]
      );
      await client.query(
        "UPDATE users SET organization_id = $1, account_type = 'institution', role = 'mosque_admin', updated_at = NOW() WHERE id = $2",
        [mosque.organization_id, userId]
      );
    });
  } else {
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    userId = cuid();
    const passwordHash = hashPassword(password);
    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO users (id, email, name, password_hash, role, account_type, organization_id, onboarding_complete, planning_year)
         VALUES ($1, $2, $3, $4, 'mosque_admin', 'institution', $5, 0, $6)`,
        [userId, email, name, passwordHash, mosque.organization_id, new Date().getFullYear()]
      );
      await client.query(
        "UPDATE mosques SET admin_user_id = $1, admin_email = $2, invite_status = 'accepted', updated_at = NOW() WHERE id = $3",
        [userId, email, mosque.id]
      );
      const memberId = cuid();
      await client.query(
        `INSERT INTO org_members (id, organization_id, mosque_id, user_id, name, email, role, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'mosque_admin', 'active')`,
        [memberId, mosque.organization_id, mosque.id, userId, name, email]
      );
    });
  }

  const user = await queryOne("SELECT id, email, name, onboarding_complete FROM users WHERE id = $1", [userId]);

  const admins = await query<{ user_id: string }>(
    "SELECT user_id FROM org_members WHERE organization_id = $1 AND role = 'admin' AND user_id IS NOT NULL",
    [mosque.organization_id]
  );
  for (const admin of admins) {
    createNotification(
      admin.user_id,
      "invite_accepted",
      "Mosque admin joined",
      `${name || email} accepted the invite for ${mosque.name}.`,
      "/org/mosques"
    ).catch(() => {});
  }

  const res = NextResponse.json({ user: toJSON(user) });
  const token = await createSession(userId);
  res.cookies.set("session", token, sessionCookieOptions());
  res.cookies.delete("user_id");
  return res;
}
