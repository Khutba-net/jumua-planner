import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { query, queryOne, cuid, toJSON } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";

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
    "SELECT id, name, email, role, status, invite_code, invite_expires_at, created_at FROM org_members WHERE organization_id = $1 ORDER BY role = 'admin' DESC, created_at ASC",
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
  const { name } = body;
  if (!name?.trim() || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (name.trim().length > 100) {
    return NextResponse.json({ error: "Name is too long" }, { status: 400 });
  }

  const inviteCode = randomBytes(4).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const id = cuid();

  await query(
    "INSERT INTO org_members (id, organization_id, name, role, status, invite_code, invite_expires_at) VALUES ($1, $2, $3, 'khatib', 'invited', $4, $5)",
    [id, user.organization_id, name.trim().slice(0, 100), inviteCode, expiresAt]
  );

  const member = await queryOne("SELECT * FROM org_members WHERE id = $1", [id]);
  return NextResponse.json(toJSON(member), { status: 201 });
}
