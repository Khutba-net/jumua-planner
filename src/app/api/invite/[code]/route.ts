import { NextResponse } from "next/server";
import { query, queryOne, cuid, toJSON, hashPassword, verifyPassword, withTransaction } from "@/lib/db";
import { createSession, sessionCookieOptions } from "@/lib/session";
import { createNotification } from "@/lib/notifications";
import { inviteSignupSchema, parseBody } from "@/lib/validations";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { code } = await params;

  const member = await queryOne<{ id: string; name: string; email: string | null; status: string; invite_expires_at: string; org_name: string; org_type: string }>(
    "SELECT m.id, m.name, m.email, m.status, m.invite_expires_at, o.name as org_name, o.type as org_type FROM org_members m JOIN organizations o ON o.id = m.organization_id WHERE m.invite_code = $1",
    [code]
  );

  if (!member) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
  }

  if (member.status !== "invited") {
    return NextResponse.json({ error: "This invite has already been used" }, { status: 410 });
  }

  if (member.invite_expires_at && new Date(member.invite_expires_at) < new Date()) {
    return NextResponse.json({ error: "This invite has expired" }, { status: 410 });
  }

  return NextResponse.json({
    khatib_name: member.name,
    org_name: member.org_name,
    org_type: member.org_type,
    email: member.email || undefined,
  });
}

export async function POST(req: Request, { params }: Params) {
  const { code } = await params;
  const body = await req.json();
  const parsed = parseBody(inviteSignupSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { name, password } = parsed.data;
  const email = parsed.data.email.toLowerCase().trim();

  const member = await queryOne<{ id: string; name: string; status: string; organization_id: string; invite_expires_at: string; org_type: string }>(
    "SELECT m.id, m.name, m.status, m.organization_id, m.invite_expires_at, o.type as org_type FROM org_members m JOIN organizations o ON o.id = m.organization_id WHERE m.invite_code = $1",
    [code]
  );

  if (!member) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
  }

  if (member.status !== "invited") {
    return NextResponse.json({ error: "This invite has already been used" }, { status: 410 });
  }

  if (member.invite_expires_at && new Date(member.invite_expires_at) < new Date()) {
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
        "UPDATE org_members SET user_id = $1, status = 'active', email = $2, updated_at = NOW() WHERE id = $3",
        [userId, email, member.id]
      );
      await client.query(
        "UPDATE users SET organization_id = $1, account_type = $2, role = 'khatib', updated_at = NOW() WHERE id = $3",
        [member.organization_id, member.org_type, userId]
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
        "INSERT INTO users (id, email, name, password_hash, role, account_type, organization_id, onboarding_complete, planning_year) VALUES ($1, $2, $3, $4, 'khatib', $5, $6, 0, $7)",
        [userId, email, name, passwordHash, member.org_type, member.organization_id, new Date().getFullYear()]
      );
      await client.query(
        "UPDATE org_members SET user_id = $1, status = 'active', email = $2, updated_at = NOW() WHERE id = $3",
        [userId, email, member.id]
      );
    });
  }

  const user = await queryOne("SELECT id, email, name, onboarding_complete FROM users WHERE id = $1", [userId]);

  const admins = await query<{ user_id: string }>(
    "SELECT user_id FROM org_members WHERE organization_id = $1 AND role = 'admin' AND user_id IS NOT NULL",
    [member.organization_id]
  );
  for (const admin of admins) {
    createNotification(
      admin.user_id,
      "invite_accepted",
      "Khatib joined",
      `${name || email} accepted the invite and joined the organization.`,
      "/org/khatibs"
    ).catch(() => {});
  }

  const res = NextResponse.json({ user: toJSON(user) });
  const token = await createSession(userId);
  res.cookies.set("session", token, sessionCookieOptions());
  res.cookies.delete("user_id");
  return res;
}
