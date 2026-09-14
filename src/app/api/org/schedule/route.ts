import { NextResponse } from "next/server";
import { query, queryOne, exec, cuid, toJSON } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";
import { sendAssignmentNotification } from "@/lib/email";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }
  const user = await queryOne<{ id: string; organization_id: string | null; role: string }>(
    "SELECT id, organization_id, role FROM users WHERE id = $1", [userId]
  );

  if (!user?.organization_id) {
    return NextResponse.json({ error: "Not part of an organization" }, { status: 403 });
  }

  const url = new URL(req.url);
  const from = url.searchParams.get("from") || new Date().toISOString().split("T")[0];
  const weeks = Math.min(Math.max(parseInt(url.searchParams.get("weeks") || "12") || 12, 1), 52);
  let mosqueId = url.searchParams.get("mosque_id");

  if (user.role === "mosque_admin" && !mosqueId) {
    const mosque = await queryOne<{ id: string }>(
      "SELECT id FROM mosques WHERE admin_user_id = $1 AND organization_id = $2",
      [userId, user.organization_id]
    );
    if (mosque) mosqueId = mosque.id;
  }

  const assignmentParams: unknown[] = [user.organization_id, from, weeks];
  let assignmentWhere = "fa.organization_id = $1 AND fa.friday_date >= $2";
  if (mosqueId) {
    assignmentWhere += " AND fa.mosque_id = $4";
    assignmentParams.push(mosqueId);
  }

  const assignments = await query(`
    SELECT fa.id, fa.friday_date, fa.member_id, fa.guest_name, fa.status, fa.swap_reason, fa.notes, fa.mosque_id,
           m.name as khatib_name, m.status as khatib_status
    FROM friday_assignments fa
    LEFT JOIN org_members m ON m.id = fa.member_id
    WHERE ${assignmentWhere}
    ORDER BY fa.friday_date ASC
    LIMIT $3
  `, assignmentParams);

  const memberParams: unknown[] = [user.organization_id];
  let memberWhere = "organization_id = $1 AND role = 'khatib' AND status = 'active'";
  if (mosqueId) {
    memberWhere += " AND mosque_id = $2";
    memberParams.push(mosqueId);
  }

  const members = await query(
    `SELECT id, name, status FROM org_members WHERE ${memberWhere} ORDER BY name`,
    memberParams
  );

  const myMember = await queryOne<{ id: string }>(
    "SELECT id FROM org_members WHERE user_id = $1 AND organization_id = $2",
    [userId, user.organization_id]
  );

  return NextResponse.json(toJSON({ assignments, members, isAdmin: user.role === "admin" || user.role === "mosque_admin", myMemberId: myMember?.id || null }));
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: Request) {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }
  const user = await queryOne<{ id: string; organization_id: string | null; role: string }>(
    "SELECT id, organization_id, role FROM users WHERE id = $1", [userId]
  );

  if (!user?.organization_id || (user.role !== "admin" && user.role !== "mosque_admin")) {
    return NextResponse.json({ error: "Not an org admin" }, { status: 403 });
  }

  const body = await req.json();
  let { friday_date, member_id, guest_name, notes, mosque_id } = body;

  if (user.role === "mosque_admin" && !mosque_id) {
    const mosque = await queryOne<{ id: string }>(
      "SELECT id FROM mosques WHERE admin_user_id = $1 AND organization_id = $2",
      [userId, user.organization_id]
    );
    if (mosque) mosque_id = mosque.id;
  }

  if (!friday_date || typeof friday_date !== "string" || !DATE_REGEX.test(friday_date)) {
    return NextResponse.json({ error: "Valid Friday date is required (YYYY-MM-DD)" }, { status: 400 });
  }

  if (!member_id && !guest_name) {
    return NextResponse.json({ error: "Select a khatib or enter a guest name" }, { status: 400 });
  }

  if (guest_name && typeof guest_name === "string" && guest_name.length > 200) {
    return NextResponse.json({ error: "Guest name is too long" }, { status: 400 });
  }

  if (notes && typeof notes === "string" && notes.length > 1000) {
    return NextResponse.json({ error: "Notes are too long" }, { status: 400 });
  }

  if (mosque_id) {
    const mosque = await queryOne("SELECT id FROM mosques WHERE id = $1 AND organization_id = $2", [mosque_id, user.organization_id]);
    if (!mosque) return NextResponse.json({ error: "Mosque not found" }, { status: 400 });
  }

  const existingParams: unknown[] = [user.organization_id, friday_date];
  let existingWhere = "organization_id = $1 AND friday_date = $2";
  if (mosque_id) {
    existingWhere += " AND mosque_id = $3";
    existingParams.push(mosque_id);
  } else {
    existingWhere += " AND mosque_id IS NULL";
  }
  const existing = await queryOne(
    `SELECT id FROM friday_assignments WHERE ${existingWhere}`,
    existingParams
  );

  if (existing) {
    return NextResponse.json({ error: "This Friday already has an assignment" }, { status: 409 });
  }

  if (member_id) {
    const member = await queryOne(
      "SELECT id FROM org_members WHERE id = $1 AND organization_id = $2 AND status = 'active'",
      [member_id, user.organization_id]
    );
    if (!member) {
      return NextResponse.json({ error: "Khatib not found or not active" }, { status: 400 });
    }
  }

  const id = cuid();
  await query(
    "INSERT INTO friday_assignments (id, organization_id, mosque_id, member_id, friday_date, guest_name, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [id, user.organization_id, mosque_id || null, member_id || null, friday_date, guest_name?.slice(0, 200) || null, notes?.slice(0, 1000) || null]
  );

  const assignment = await queryOne("SELECT * FROM friday_assignments WHERE id = $1", [id]);

  if (member_id && process.env.RESEND_API_KEY) {
    const member = await queryOne<{ name: string; user_id: string | null }>(
      "SELECT name, user_id FROM org_members WHERE id = $1", [member_id]
    );
    if (member?.user_id) {
      const khatibUser = await queryOne<{ email: string }>("SELECT email FROM users WHERE id = $1", [member.user_id]);
      if (khatibUser) {
        const mosqueName = mosque_id
          ? (await queryOne<{ name: string }>("SELECT name FROM mosques WHERE id = $1", [mosque_id]))?.name ?? "Mosque"
          : (await queryOne<{ name: string }>("SELECT name FROM organizations WHERE id = $1", [user.organization_id]))?.name ?? "Organization";
        const dateFormatted = new Date(friday_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        await sendAssignmentNotification(khatibUser.email, member.name, notes || "Friday Khutbah", dateFormatted, mosqueName).catch((err) =>
          logger.error("Failed to send assignment email", { error: String(err) })
        );
      }
    }
  }

  return NextResponse.json(toJSON(assignment), { status: 201 });
}

export async function PUT(req: Request) {
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

  const body = await req.json();
  const { id, member_id, guest_name, swap_reason, notes } = body;

  if (!id) {
    return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 });
  }

  const assignment = await queryOne(
    "SELECT id FROM friday_assignments WHERE id = $1 AND organization_id = $2",
    [id, user.organization_id]
  );

  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  if (member_id) {
    const member = await queryOne(
      "SELECT id FROM org_members WHERE id = $1 AND organization_id = $2 AND status = 'active'",
      [member_id, user.organization_id]
    );
    if (!member) {
      return NextResponse.json({ error: "Khatib not found or not active" }, { status: 400 });
    }
  }

  if (swap_reason && typeof swap_reason === "string" && swap_reason.length > 500) {
    return NextResponse.json({ error: "Swap reason is too long" }, { status: 400 });
  }

  const oldAssignment = await queryOne<{ member_id: string | null; friday_date: string; mosque_id: string | null }>(
    "SELECT member_id, friday_date, mosque_id FROM friday_assignments WHERE id = $1", [id]
  );

  await exec(
    "UPDATE friday_assignments SET member_id = $1, guest_name = $2, swap_reason = $3, notes = $4, updated_at = NOW() WHERE id = $5",
    [member_id || null, guest_name?.slice(0, 200) || null, swap_reason?.slice(0, 500) || null, notes?.slice(0, 1000) || null, id]
  );

  if (member_id && member_id !== oldAssignment?.member_id && process.env.RESEND_API_KEY) {
    const member = await queryOne<{ name: string; user_id: string | null }>(
      "SELECT name, user_id FROM org_members WHERE id = $1", [member_id]
    );
    if (member?.user_id) {
      const khatibUser = await queryOne<{ email: string }>("SELECT email FROM users WHERE id = $1", [member.user_id]);
      if (khatibUser && oldAssignment) {
        const mosqueName = oldAssignment.mosque_id
          ? (await queryOne<{ name: string }>("SELECT name FROM mosques WHERE id = $1", [oldAssignment.mosque_id]))?.name ?? "Mosque"
          : (await queryOne<{ name: string }>("SELECT name FROM organizations WHERE id = $1", [user.organization_id]))?.name ?? "Organization";
        const dateFormatted = new Date(oldAssignment.friday_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        await sendAssignmentNotification(khatibUser.email, member.name, swap_reason ? `Swap: ${swap_reason}` : "Friday Khutbah", dateFormatted, mosqueName).catch((err) =>
          logger.error("Failed to send swap email", { error: String(err) })
        );
      }
    }
  }

  const updated = await queryOne("SELECT * FROM friday_assignments WHERE id = $1", [id]);
  return NextResponse.json(toJSON(updated));
}

export async function PATCH(req: Request) {
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

  const body = await req.json();
  const { from_member_id, to_member_id } = body;

  if (!from_member_id || !to_member_id || from_member_id === to_member_id) {
    return NextResponse.json({ error: "Select two different khatibs" }, { status: 400 });
  }

  const fromMember = await queryOne(
    "SELECT id FROM org_members WHERE id = $1 AND organization_id = $2",
    [from_member_id, user.organization_id]
  );
  const toMember = await queryOne(
    "SELECT id FROM org_members WHERE id = $1 AND organization_id = $2 AND status = 'active'",
    [to_member_id, user.organization_id]
  );

  if (!fromMember) return NextResponse.json({ error: "Source khatib not found" }, { status: 400 });
  if (!toMember) return NextResponse.json({ error: "Target khatib not found or inactive" }, { status: 400 });

  const today = new Date().toISOString().split("T")[0];
  const result = await query(
    "UPDATE friday_assignments SET member_id = $1, updated_at = NOW() WHERE organization_id = $2 AND member_id = $3 AND friday_date >= $4",
    [to_member_id, user.organization_id, from_member_id, today]
  );

  return NextResponse.json({ ok: true, updated: Array.isArray(result) ? result.length : 0 });
}

export async function DELETE(req: Request) {
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

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 });
  }

  const assignment = await queryOne(
    "SELECT id FROM friday_assignments WHERE id = $1 AND organization_id = $2",
    [id, user.organization_id]
  );

  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  await exec("DELETE FROM friday_assignments WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}
