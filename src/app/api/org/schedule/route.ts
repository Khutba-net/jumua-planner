import { NextResponse } from "next/server";
import { db, cuid, toJSON } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await getUserId();
  const user = db.prepare("SELECT id, organization_id, role FROM users WHERE id = ?").get(userId) as { id: string; organization_id: string | null; role: string } | undefined;

  if (!user?.organization_id) {
    return NextResponse.json({ error: "Not part of an organization" }, { status: 403 });
  }

  const url = new URL(req.url);
  const from = url.searchParams.get("from") || new Date().toISOString().split("T")[0];
  const weeks = parseInt(url.searchParams.get("weeks") || "12");

  const assignments = db.prepare(`
    SELECT fa.id, fa.friday_date, fa.member_id, fa.guest_name, fa.status, fa.swap_reason, fa.notes,
           m.name as khatib_name, m.status as khatib_status
    FROM friday_assignments fa
    LEFT JOIN org_members m ON m.id = fa.member_id
    WHERE fa.organization_id = ? AND fa.friday_date >= ?
    ORDER BY fa.friday_date ASC
    LIMIT ?
  `).all(user.organization_id, from, weeks);

  const members = db.prepare(
    "SELECT id, name, status FROM org_members WHERE organization_id = ? AND role = 'khatib' AND status = 'active' ORDER BY name"
  ).all(user.organization_id);

  const myMember = db.prepare(
    "SELECT id FROM org_members WHERE user_id = ? AND organization_id = ?"
  ).get(userId, user.organization_id) as { id: string } | undefined;

  return NextResponse.json(toJSON({ assignments, members, isAdmin: user.role === "admin", myMemberId: myMember?.id || null }));
}

export async function POST(req: Request) {
  const userId = await getUserId();
  const user = db.prepare("SELECT id, organization_id, role FROM users WHERE id = ?").get(userId) as { id: string; organization_id: string | null; role: string } | undefined;

  if (!user?.organization_id || user.role !== "admin") {
    return NextResponse.json({ error: "Not an org admin" }, { status: 403 });
  }

  const body = await req.json();
  const { friday_date, member_id, guest_name, notes } = body;

  if (!friday_date) {
    return NextResponse.json({ error: "Friday date is required" }, { status: 400 });
  }

  if (!member_id && !guest_name) {
    return NextResponse.json({ error: "Select a khatib or enter a guest name" }, { status: 400 });
  }

  const existing = db.prepare(
    "SELECT id FROM friday_assignments WHERE organization_id = ? AND friday_date = ?"
  ).get(user.organization_id, friday_date);

  if (existing) {
    return NextResponse.json({ error: "This Friday already has an assignment" }, { status: 409 });
  }

  if (member_id) {
    const member = db.prepare(
      "SELECT id FROM org_members WHERE id = ? AND organization_id = ? AND status = 'active'"
    ).get(member_id, user.organization_id);
    if (!member) {
      return NextResponse.json({ error: "Khatib not found or not active" }, { status: 400 });
    }
  }

  const id = cuid();
  db.prepare(
    "INSERT INTO friday_assignments (id, organization_id, member_id, friday_date, guest_name, notes) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, user.organization_id, member_id || null, friday_date, guest_name || null, notes || null);

  const assignment = db.prepare("SELECT * FROM friday_assignments WHERE id = ?").get(id);
  return NextResponse.json(toJSON(assignment), { status: 201 });
}

export async function PUT(req: Request) {
  const userId = await getUserId();
  const user = db.prepare("SELECT id, organization_id, role FROM users WHERE id = ?").get(userId) as { id: string; organization_id: string | null; role: string } | undefined;

  if (!user?.organization_id || user.role !== "admin") {
    return NextResponse.json({ error: "Not an org admin" }, { status: 403 });
  }

  const body = await req.json();
  const { id, member_id, guest_name, swap_reason, notes } = body;

  if (!id) {
    return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 });
  }

  const assignment = db.prepare(
    "SELECT id FROM friday_assignments WHERE id = ? AND organization_id = ?"
  ).get(id, user.organization_id);

  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  db.prepare(
    "UPDATE friday_assignments SET member_id = ?, guest_name = ?, swap_reason = ?, notes = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(member_id || null, guest_name || null, swap_reason || null, notes || null, id);

  const updated = db.prepare("SELECT * FROM friday_assignments WHERE id = ?").get(id);
  return NextResponse.json(toJSON(updated));
}

export async function DELETE(req: Request) {
  const userId = await getUserId();
  const user = db.prepare("SELECT id, organization_id, role FROM users WHERE id = ?").get(userId) as { id: string; organization_id: string | null; role: string } | undefined;

  if (!user?.organization_id || user.role !== "admin") {
    return NextResponse.json({ error: "Not an org admin" }, { status: 403 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 });
  }

  const assignment = db.prepare(
    "SELECT id FROM friday_assignments WHERE id = ? AND organization_id = ?"
  ).get(id, user.organization_id);

  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  db.prepare("DELETE FROM friday_assignments WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
