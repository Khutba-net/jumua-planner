import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { queryOne, exec, toJSON } from "@/lib/db";
import { deleteAllUserSessions } from "@/lib/session";
import { getUserId, AuthError } from "@/lib/auth";
import { sendInvitation } from "@/lib/email";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
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

    if (member.email && process.env.RESEND_API_KEY) {
      const org = await queryOne<{ name: string }>("SELECT name FROM organizations WHERE id = $1", [user.organization_id]);
      const admin = await queryOne<{ name: string }>("SELECT name FROM users WHERE id = $1", [userId]);
      const mosqueName = member.mosque_id ? (await queryOne<{ name: string }>("SELECT name FROM mosques WHERE id = $1", [member.mosque_id]))?.name : null;
      const orgLabel = mosqueName ? `${org?.name ?? "your organization"} — ${mosqueName}` : (org?.name ?? "your organization");
      const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3100";
      await sendInvitation(member.email as string, admin?.name ?? "Admin", orgLabel, `${APP_URL}/invite/${newCode}`).catch((err) =>
        console.error("Failed to resend invitation email:", err)
      );
    }
  } else if (action === "deactivate") {
    if (member.user_id === userId) {
      return NextResponse.json({ error: "You cannot deactivate yourself" }, { status: 400 });
    }
    if (member.user_id) {
      await deleteAllUserSessions(member.user_id as string);
    }
    await exec("UPDATE org_members SET status = 'deactivated', updated_at = NOW() WHERE id = $1", [id]);
    const today = new Date().toISOString().split("T")[0];
    await exec(
      "UPDATE friday_assignments SET member_id = NULL, swap_reason = 'Khatib deactivated', updated_at = NOW() WHERE member_id = $1 AND friday_date >= $2",
      [id, today]
    );
  } else if (action === "reactivate") {
    await exec("UPDATE org_members SET status = 'active', updated_at = NOW() WHERE id = $1", [id]);
  } else if (action === "transfer_admin") {
    if (member.status !== "active" || !member.user_id) {
      return NextResponse.json({ error: "Can only transfer admin to an active member with an account" }, { status: 400 });
    }
    await exec("UPDATE org_members SET role = 'admin', updated_at = NOW() WHERE id = $1", [id]);
    await exec("UPDATE users SET role = 'admin', updated_at = NOW() WHERE id = $1", [member.user_id]);
    const adminMember = await queryOne("SELECT id FROM org_members WHERE user_id = $1 AND organization_id = $2", [userId, user.organization_id]);
    if (adminMember) {
      await exec("UPDATE org_members SET role = 'khatib', updated_at = NOW() WHERE id = $1", [adminMember.id]);
    }
    await exec("UPDATE users SET role = 'khatib', updated_at = NOW() WHERE id = $1", [userId]);
  } else if (action === "assign_mosque") {
    const { mosque_id } = body;
    if (mosque_id) {
      const mosque = await queryOne("SELECT id FROM mosques WHERE id = $1 AND organization_id = $2", [mosque_id, user.organization_id]);
      if (!mosque) return NextResponse.json({ error: "Mosque not found" }, { status: 400 });
    }
    await exec("UPDATE org_members SET mosque_id = $1, updated_at = NOW() WHERE id = $2", [mosque_id || null, id]);
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const updated = await queryOne("SELECT * FROM org_members WHERE id = $1", [id]);
  return NextResponse.json(toJSON(updated));
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
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

  const member = await queryOne<Record<string, unknown>>(
    "SELECT * FROM org_members WHERE id = $1 AND organization_id = $2", [id, user.organization_id]
  );
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (member.role === "admin") {
    return NextResponse.json({ error: "Cannot remove an admin member" }, { status: 400 });
  }

  if (member.status !== "invited" && member.status !== "deactivated") {
    return NextResponse.json({ error: "Deactivate the member before removing them" }, { status: 400 });
  }

  await exec("DELETE FROM friday_assignments WHERE member_id = $1", [id]);
  await exec("DELETE FROM org_members WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}
