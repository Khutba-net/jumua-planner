import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db, cuid, toJSON } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getUserId();
  const user = db.prepare("SELECT id, organization_id, role FROM users WHERE id = ?").get(userId) as { id: string; organization_id: string | null; role: string } | undefined;

  if (!user?.organization_id || user.role !== "admin") {
    return NextResponse.json({ error: "Not an org admin" }, { status: 403 });
  }

  const members = db.prepare(
    "SELECT id, name, email, role, status, invite_code, invite_expires_at, created_at FROM org_members WHERE organization_id = ? ORDER BY role = 'admin' DESC, created_at ASC"
  ).all(user.organization_id);

  return NextResponse.json(toJSON(members));
}

export async function POST(req: Request) {
  const userId = await getUserId();
  const user = db.prepare("SELECT id, organization_id, role FROM users WHERE id = ?").get(userId) as { id: string; organization_id: string | null; role: string } | undefined;

  if (!user?.organization_id || user.role !== "admin") {
    return NextResponse.json({ error: "Not an org admin" }, { status: 403 });
  }

  const memberCount = (db.prepare("SELECT COUNT(*) as count FROM org_members WHERE organization_id = ?").get(user.organization_id) as { count: number }).count;
  if (memberCount >= 11) {
    return NextResponse.json({ error: "Maximum 10 khatibs reached" }, { status: 400 });
  }

  const body = await req.json();
  const { name } = body;
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const inviteCode = randomBytes(4).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const id = cuid();

  db.prepare(
    "INSERT INTO org_members (id, organization_id, name, role, status, invite_code, invite_expires_at) VALUES (?, ?, ?, 'khatib', 'invited', ?, ?)"
  ).run(id, user.organization_id, name.trim(), inviteCode, expiresAt);

  const member = db.prepare("SELECT * FROM org_members WHERE id = ?").get(id);
  return NextResponse.json(toJSON(member), { status: 201 });
}
