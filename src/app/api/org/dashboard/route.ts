import { NextResponse } from "next/server";
import { query, queryOne, toJSON } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: (e as AuthError).status });
    throw e;
  }
  const user = await queryOne<{ id: string; organization_id: string | null; role: string; planning_year: number }>(
    "SELECT id, organization_id, role, planning_year FROM users WHERE id = $1", [userId]
  );

  if (!user?.organization_id || (user.role !== "admin" && user.role !== "mosque_admin")) {
    return NextResponse.json({ error: "Not an org admin" }, { status: 403 });
  }

  let scopedMosqueId: string | null = null;
  if (user.role === "mosque_admin") {
    const mosque = await queryOne<{ id: string }>(
      "SELECT id FROM mosques WHERE admin_user_id = $1 AND organization_id = $2",
      [userId, user.organization_id]
    );
    if (!mosque) return NextResponse.json({ error: "Mosque not found" }, { status: 403 });
    scopedMosqueId = mosque.id;
  }

  const org = await queryOne("SELECT id, name, type, city, country FROM organizations WHERE id = $1", [user.organization_id]);

  const mosqueFilter = scopedMosqueId ? " AND mosque_id = $2" : "";
  const memberParams: string[] = [user.organization_id];
  if (scopedMosqueId) memberParams.push(scopedMosqueId);

  const members = await query<{ id: string; name: string; email: string | null; role: string; status: string; user_id: string | null; mosque_id: string | null; mosque_name: string | null }>(
    `SELECT om.id, om.name, om.email, om.role, om.status, om.user_id, om.mosque_id, m.name as mosque_name
     FROM org_members om
     LEFT JOIN mosques m ON om.mosque_id = m.id
     WHERE om.organization_id = $1${mosqueFilter}
     ORDER BY om.role = 'admin' DESC, om.created_at ASC`,
    memberParams
  );

  const khatibStats = [];
  for (const m of members.filter((m) => m.role === "khatib" && m.user_id)) {
    const totalRow = await queryOne<{ c: string }>("SELECT COUNT(*) as c FROM sermons WHERE author_id = $1", [m.user_id]);
    const readyRow = await queryOne<{ c: string }>("SELECT COUNT(*) as c FROM sermons WHERE author_id = $1 AND status = 'ready'", [m.user_id]);
    const deliveredRow = await queryOne<{ c: string }>("SELECT COUNT(*) as c FROM sermons WHERE author_id = $1 AND status = 'delivered'", [m.user_id]);

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
      mosque_name: m.mosque_name,
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

  const assignmentMosqueFilter = scopedMosqueId ? " AND fa.mosque_id = $3" : "";
  const assignmentParams: string[] = [user.organization_id, thisFridayDate];
  if (scopedMosqueId) assignmentParams.push(scopedMosqueId);

  const thisFridayAssignment = await queryOne<{ id: string; friday_date: string; guest_name: string | null; khatib_name: string | null; notes: string | null }>(`
    SELECT fa.id, fa.friday_date, fa.guest_name, fa.notes, m.name as khatib_name
    FROM friday_assignments fa
    LEFT JOIN org_members m ON fa.member_id = m.id
    WHERE fa.organization_id = $1 AND fa.friday_date = $2${assignmentMosqueFilter}
    LIMIT 1
  `, assignmentParams);

  // For institution accounts, include mosque overview
  let mosqueOverview = null;
  if (org && (org as Record<string, unknown>).type === "institution") {
    const mosques = await query<{ id: string; name: string; city: string | null; khatib_count: string; active_khatib_count: string }>(`
      SELECT m.id, m.name, m.city,
        (SELECT COUNT(*) FROM org_members om WHERE om.mosque_id = m.id AND om.role = 'khatib') as khatib_count,
        (SELECT COUNT(*) FROM org_members om WHERE om.mosque_id = m.id AND om.role = 'khatib' AND om.status = 'active') as active_khatib_count
      FROM mosques m
      WHERE m.organization_id = $1
      ORDER BY m.created_at ASC
    `, [user.organization_id]);

    const mosqueSchedules = [];
    for (const mosque of mosques) {
      const assignment = await queryOne<{ friday_date: string; guest_name: string | null; khatib_name: string | null }>(`
        SELECT fa.friday_date, fa.guest_name, m.name as khatib_name
        FROM friday_assignments fa
        LEFT JOIN org_members m ON fa.member_id = m.id
        WHERE fa.mosque_id = $1 AND fa.friday_date = $2
        LIMIT 1
      `, [mosque.id, thisFridayDate]);

      mosqueSchedules.push({
        id: mosque.id,
        name: mosque.name,
        city: mosque.city,
        khatib_count: Number(mosque.khatib_count),
        active_khatib_count: Number(mosque.active_khatib_count),
        thisFriday: assignment ? {
          khatib: assignment.guest_name || assignment.khatib_name,
          isGuest: !!assignment.guest_name,
        } : null,
      });
    }
    mosqueOverview = mosqueSchedules;
  }

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
    mosqueOverview,
  }));
}
