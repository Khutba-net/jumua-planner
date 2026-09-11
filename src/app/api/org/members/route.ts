import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { query, queryOne, cuid, toJSON } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";
import { sendInvitation } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET() {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }
  const user = await queryOne<{ id: string; organization_id: string | null; role: string }>(
    "SELECT id, organization_id, role FROM users WHERE id = $1", [userId]
  );

  if (!user?.organization_id || user.role !== "admin") {
    return NextResponse.json({ error: "Not an org admin" }, { status: 403 });
  }

  const members = await query(
    `SELECT om.id, om.name, om.email, om.role, om.status, om.invite_code, om.invite_expires_at, om.created_at, om.mosque_id,
            m.name as mosque_name
     FROM org_members om
     LEFT JOIN mosques m ON m.id = om.mosque_id
     WHERE om.organization_id = $1 ORDER BY om.role = 'admin' DESC, om.created_at ASC`,
    [user.organization_id]
  );

  return NextResponse.json(toJSON(members));
}

export async function POST(req: Request) {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }
  const user = await queryOne<{ id: string; organization_id: string | null; role: string }>(
    "SELECT id, organization_id, role FROM users WHERE id = $1", [userId]
  );

  if (!user?.organization_id || user.role !== "admin") {
    return NextResponse.json({ error: "Not an org admin" }, { status: 403 });
  }

  const countRow = await queryOne<{ count: string }>(
    "SELECT COUNT(*) as count FROM org_members WHERE organization_id = $1", [user.organization_id]
  );
  if (Number(countRow?.count ?? 0) >= 11) {
    return NextResponse.json({ error: "Maximum 10 khatibs reached" }, { status: 400 });
  }

  const body = await req.json();
  const { name, mosque_id, email: inviteEmail } = body;
  if (!name?.trim() || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (name.trim().length > 100) {
    return NextResponse.json({ error: "Name is too long" }, { status: 400 });
  }

  if (mosque_id) {
    const mosque = await queryOne("SELECT id FROM mosques WHERE id = $1 AND organization_id = $2", [mosque_id, user.organization_id]);
    if (!mosque) return NextResponse.json({ error: "Mosque not found" }, { status: 400 });
  }

  const inviteCode = randomBytes(4).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const id = cuid();

  await query(
    "INSERT INTO org_members (id, organization_id, mosque_id, name, role, status, invite_code, invite_expires_at) VALUES ($1, $2, $3, $4, 'khatib', 'invited', $5, $6)",
    [id, user.organization_id, mosque_id || null, name.trim().slice(0, 100), inviteCode, expiresAt]
  );

  const member = await queryOne("SELECT * FROM org_members WHERE id = $1", [id]);

  if (inviteEmail && typeof inviteEmail === "string" && process.env.RESEND_API_KEY) {
    const org = await queryOne<{ name: string }>("SELECT name FROM organizations WHERE id = $1", [user.organization_id]);
    const admin = await queryOne<{ name: string }>("SELECT name FROM users WHERE id = $1", [userId]);
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3100";
    const inviteUrl = `${APP_URL}/invite/${inviteCode}`;
    await sendInvitation(inviteEmail.trim(), admin?.name ?? "Admin", org?.name ?? "your organization", inviteUrl).catch((err) =>
      console.error("Failed to send invitation email:", err)
    );
  }

  return NextResponse.json(toJSON(member), { status: 201 });
}
