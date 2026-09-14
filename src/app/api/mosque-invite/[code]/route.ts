import { NextResponse } from "next/server";
import { query, queryOne, cuid, toJSON, hashPassword, withTransaction } from "@/lib/db";
import { createSession, sessionCookieOptions } from "@/lib/session";
import { signupSchema, parseBody } from "@/lib/validations";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { code } = await params;

  const mosque = await queryOne<{ id: string; name: string; invite_status: string; invite_expires_at: string; org_name: string; org_id: string }>(
    `SELECT m.id, m.name, m.invite_status, m.invite_expires_at, o.name as org_name, o.id as org_id
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
  });
}

export async function POST(req: Request, { params }: Params) {
  const { code } = await params;
  const body = await req.json();
  const parsed = parseBody(signupSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { name, password } = parsed.data;
  const email = parsed.data.email.toLowerCase().trim();

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

  const existing = await queryOne("SELECT id FROM users WHERE LOWER(email) = $1", [email]);
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists. Log in and use the invite link." }, { status: 409 });
  }

  const userId = cuid();
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

  const user = await queryOne("SELECT id, email, name, onboarding_complete FROM users WHERE id = $1", [userId]);

  const res = NextResponse.json({ user: toJSON(user) });
  const token = await createSession(userId);
  res.cookies.set("session", token, sessionCookieOptions());
  res.cookies.delete("user_id");
  return res;
}
