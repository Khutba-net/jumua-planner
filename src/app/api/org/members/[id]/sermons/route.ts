import { NextResponse } from "next/server";
import { query, queryOne, toJSON } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const userId = await getUserId();
  const user = await queryOne<{ id: string; organization_id: string | null; role: string }>(
    "SELECT id, organization_id, role FROM users WHERE id = $1", [userId]
  );

  if (!user?.organization_id || user.role !== "admin") {
    return NextResponse.json({ error: "Not an org admin" }, { status: 403 });
  }

  const member = await queryOne<{ id: string; name: string; user_id: string | null; status: string }>(
    "SELECT id, name, user_id, status FROM org_members WHERE id = $1 AND organization_id = $2",
    [id, user.organization_id]
  );

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (!member.user_id) {
    return NextResponse.json({ member: { id: member.id, name: member.name, status: member.status }, sermons: [] });
  }

  const sermons = await query(`
    SELECT s.id, s.title, s.status, s.scheduled_date, s.updated_at,
           t.name as theme_name, t.color as theme_color
    FROM sermons s
    LEFT JOIN themes t ON s.theme_id = t.id
    WHERE s.author_id = $1
    ORDER BY s.scheduled_date DESC NULLS LAST, s.updated_at DESC
  `, [member.user_id]);

  const stats = await queryOne<{ total: string; drafts: string; ready: string; delivered: string }>(`
    SELECT COUNT(*) as total,
           SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as drafts,
           SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) as ready,
           SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered
    FROM sermons WHERE author_id = $1
  `, [member.user_id]);

  return NextResponse.json(toJSON({
    member: { id: member.id, name: member.name, status: member.status },
    sermons,
    stats: {
      total: Number(stats?.total ?? 0),
      drafts: Number(stats?.drafts ?? 0),
      ready: Number(stats?.ready ?? 0),
      delivered: Number(stats?.delivered ?? 0),
    },
  }));
}
