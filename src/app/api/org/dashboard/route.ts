import { NextResponse } from "next/server";
import { db, toJSON } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getUserId();
  const user = db.prepare("SELECT id, organization_id, role, planning_year FROM users WHERE id = ?").get(userId) as { id: string; organization_id: string | null; role: string; planning_year: number } | undefined;

  if (!user?.organization_id || user.role !== "admin") {
    return NextResponse.json({ error: "Not an org admin" }, { status: 403 });
  }

  const org = db.prepare("SELECT id, name, type, city, country FROM organizations WHERE id = ?").get(user.organization_id);

  const members = db.prepare(
    "SELECT id, name, email, role, status, user_id FROM org_members WHERE organization_id = ? ORDER BY role = 'admin' DESC, created_at ASC"
  ).all(user.organization_id) as Array<{ id: string; name: string; email: string | null; role: string; status: string; user_id: string | null }>;

  const khatibStats = members
    .filter((m) => m.role === "khatib" && m.user_id)
    .map((m) => {
      const total = (db.prepare("SELECT COUNT(*) as c FROM sermons WHERE author_id = ?").get(m.user_id) as { c: number }).c;
      const ready = (db.prepare("SELECT COUNT(*) as c FROM sermons WHERE author_id = ? AND status = 'ready'").get(m.user_id) as { c: number }).c;
      const delivered = (db.prepare("SELECT COUNT(*) as c FROM sermons WHERE author_id = ? AND status = 'delivered'").get(m.user_id) as { c: number }).c;
      const thisWeekSermon = db.prepare(
        "SELECT id, title, status, scheduled_date FROM sermons WHERE author_id = ? AND scheduled_date >= date('now', 'weekday 5', '-7 days') AND scheduled_date <= date('now', 'weekday 5') LIMIT 1"
      ).get(m.user_id);

      return {
        member_id: m.id,
        name: m.name,
        user_id: m.user_id,
        total_sermons: total,
        ready_sermons: ready,
        delivered_sermons: delivered,
        this_week_sermon: thisWeekSermon ? toJSON(thisWeekSermon) : null,
      };
    });

  const totalKhatibs = members.filter((m) => m.role === "khatib").length;
  const activeKhatibs = members.filter((m) => m.role === "khatib" && m.status === "active").length;
  const pendingInvites = members.filter((m) => m.role === "khatib" && m.status === "invited").length;

  return NextResponse.json(toJSON({
    organization: org,
    stats: { totalKhatibs, activeKhatibs, pendingInvites },
    khatibStats,
  }));
}
