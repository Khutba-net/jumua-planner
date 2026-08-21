import { NextResponse } from "next/server";
import { query, queryOne, toJSON } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getUserId();
  const user = await queryOne<{ id: string; organization_id: string | null; role: string; planning_year: number }>(
    "SELECT id, organization_id, role, planning_year FROM users WHERE id = $1", [userId]
  );

  if (!user?.organization_id || user.role !== "admin") {
    return NextResponse.json({ error: "Not an org admin" }, { status: 403 });
  }

  const org = await queryOne("SELECT id, name, type, city, country FROM organizations WHERE id = $1", [user.organization_id]);

  const members = await query<{ id: string; name: string; email: string | null; role: string; status: string; user_id: string | null }>(
    "SELECT id, name, email, role, status, user_id FROM org_members WHERE organization_id = $1 ORDER BY role = 'admin' DESC, created_at ASC",
    [user.organization_id]
  );

  const today = new Date().toISOString().split("T")[0];

  const khatibStats = [];
  for (const m of members.filter((m) => m.role === "khatib" && m.user_id)) {
    const totalRow = await queryOne<{ c: string }>("SELECT COUNT(*) as c FROM sermons WHERE author_id = $1", [m.user_id]);
    const readyRow = await queryOne<{ c: string }>("SELECT COUNT(*) as c FROM sermons WHERE author_id = $1 AND status = 'ready'", [m.user_id]);
    const deliveredRow = await queryOne<{ c: string }>("SELECT COUNT(*) as c FROM sermons WHERE author_id = $1 AND status = 'delivered'", [m.user_id]);

    // Get this week's Friday sermon (calculate in JS like the main dashboard)
    const now = new Date();
    const day = now.getDay();
    const diff = (5 - day + 7) % 7;
    const friday = new Date(now);
    friday.setDate(now.getDate() + (diff === 0 ? 0 : diff));
    const thisFridayDate = friday.toISOString().split("T")[0];
    const lastFridayDate = new Date(friday.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const thisWeekSermon = await queryOne(
      "SELECT id, title, status, scheduled_date FROM sermons WHERE author_id = $1 AND scheduled_date >= $2 AND scheduled_date <= $3 LIMIT 1",
      [m.user_id, lastFridayDate, thisFridayDate]
    );

    khatibStats.push({
      member_id: m.id,
      name: m.name,
      user_id: m.user_id,
      total_sermons: Number(totalRow?.c ?? 0),
      ready_sermons: Number(readyRow?.c ?? 0),
      delivered_sermons: Number(deliveredRow?.c ?? 0),
      this_week_sermon: thisWeekSermon ? toJSON(thisWeekSermon) : null,
    });
  }

  const totalKhatibs = members.filter((m) => m.role === "khatib").length;
  const activeKhatibs = members.filter((m) => m.role === "khatib" && m.status === "active").length;
  const pendingInvites = members.filter((m) => m.role === "khatib" && m.status === "invited").length;

  const now = new Date();
  const day = now.getDay();
  const diff = (5 - day + 7) % 7;
  const friday = new Date(now);
  friday.setDate(now.getDate() + (diff === 0 ? 0 : diff));
  const thisFridayDate = friday.toISOString().split("T")[0];

  const thisFridayAssignment = await queryOne<{ id: string; friday_date: string; guest_name: string | null; khatib_name: string | null; notes: string | null }>(`
    SELECT fa.id, fa.friday_date, fa.guest_name, fa.notes, m.name as khatib_name
    FROM friday_assignments fa
    LEFT JOIN org_members m ON fa.member_id = m.id
    WHERE fa.organization_id = $1 AND fa.friday_date = $2
    LIMIT 1
  `, [user.organization_id, thisFridayDate]);

  return NextResponse.json(toJSON({
    organization: org,
    stats: { totalKhatibs, activeKhatibs, pendingInvites },
    khatibStats,
    thisFriday: thisFridayAssignment ? {
      date: thisFridayAssignment.friday_date,
      khatib: thisFridayAssignment.guest_name || thisFridayAssignment.khatib_name,
      isGuest: !!thisFridayAssignment.guest_name,
      notes: thisFridayAssignment.notes,
    } : { date: thisFridayDate, khatib: null, isGuest: false, notes: null },
  }));
}
