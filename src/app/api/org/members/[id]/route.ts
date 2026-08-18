import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db, toJSON } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const userId = await getUserId();
  const user = db.prepare("SELECT id, organization_id, role FROM users WHERE id = ?").get(userId) as { id: string; organization_id: string | null; role: string } | undefined;

  if (!user?.organization_id || user.role !== "admin") {
    return NextResponse.json({ error: "Not an org admin" }, { status: 403 });
  }

  const member = db.prepare("SELECT * FROM org_members WHERE id = ? AND organization_id = ?").get(id, user.organization_id) as Record<string, unknown> | undefined;
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const body = await req.json();
  const { action } = body;

  if (action === "resend") {
    if (member.status !== "invited") {
      return NextResponse.json({ error: "Can only resend for invited members" }, { status: 400 });
    }
    const newCode = randomBytes(4).toString("hex");
    const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare("UPDATE org_members SET invite_code = ?, invite_expires_at = ?, updated_at = datetime('now') WHERE id = ?").run(newCode, newExpiry, id);
  } else if (action === "deactivate") {
    db.prepare("UPDATE org_members SET status = 'deactivated', updated_at = datetime('now') WHERE id = ?").run(id);
  } else if (action === "reactivate") {
    db.prepare("UPDATE org_members SET status = 'active', updated_at = datetime('now') WHERE id = ?").run(id);
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const updated = db.prepare("SELECT * FROM org_members WHERE id = ?").get(id);
  return NextResponse.json(toJSON(updated));
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const userId = await getUserId();
  const user = db.prepare("SELECT id, organization_id, role FROM users WHERE id = ?").get(userId) as { id: string; organization_id: string | null; role: string } | undefined;

  if (!user?.organization_id || user.role !== "admin") {
    return NextResponse.json({ error: "Not an org admin" }, { status: 403 });
  }

  const member = db.prepare("SELECT * FROM org_members WHERE id = ? AND organization_id = ?").get(id, user.organization_id) as Record<string, unknown> | undefined;
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (member.status !== "invited") {
    return NextResponse.json({ error: "Can only remove pending invites" }, { status: 400 });
  }

  db.prepare("DELETE FROM org_members WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
