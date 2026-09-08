import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { queryOne, exec, toJSON } from "@/lib/db";
import { deleteAllUserSessions } from "@/lib/session";
import { getUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const userId = await getUserId();
  const user = await queryOne<{ id: string; organization_id: string | null; role: string }>(
    "SELECT id, organization_id, role FROM users WHERE id = $1", [userId]
  );

  if (!user?.organization_id || user.role !== "admin") {
    return NextResponse.json({ error: "Not an org admin" }, { status: 403 });
  }

  const member = await queryOne<Record<string, unknown>>(
    "SELECT * FROM org_members WHERE id = $1 AND organization_id = $2", [id, user.organization_id]
  );
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
    await exec("UPDATE org_members SET invite_code = $1, invite_expires_at = $2, updated_at = NOW() WHERE id = $3", [newCode, newExpiry, id]);
  } else if (action === "deactivate") {
    if (member.user_id) {
      await deleteAllUserSessions(member.user_id as string);
    }
    await exec("UPDATE org_members SET status = 'deactivated', updated_at = NOW() WHERE id = $1", [id]);
  } else if (action === "reactivate") {
    await exec("UPDATE org_members SET status = 'active', updated_at = NOW() WHERE id = $1", [id]);
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const updated = await queryOne("SELECT * FROM org_members WHERE id = $1", [id]);
  return NextResponse.json(toJSON(updated));
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const userId = await getUserId();
  const user = await queryOne<{ id: string; organization_id: string | null; role: string }>(
    "SELECT id, organization_id, role FROM users WHERE id = $1", [userId]
  );

  if (!user?.organization_id || user.role !== "admin") {
    return NextResponse.json({ error: "Not an org admin" }, { status: 403 });
  }

  const member = await queryOne<Record<string, unknown>>(
    "SELECT * FROM org_members WHERE id = $1 AND organization_id = $2", [id, user.organization_id]
  );
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (member.status !== "invited") {
    return NextResponse.json({ error: "Can only remove pending invites" }, { status: 400 });
  }

  await exec("DELETE FROM org_members WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}
