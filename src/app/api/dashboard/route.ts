import { NextResponse } from "next/server";
import { db, toJSON } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const totalSermons = (db.prepare(
    "SELECT COUNT(*) as count FROM sermons WHERE author_id = ?"
  ).get(userId) as { count: number }).count;

  const draftCount = (db.prepare(
    "SELECT COUNT(*) as count FROM sermons WHERE author_id = ? AND status = 'draft'"
  ).get(userId) as { count: number }).count;

  const readyCount = (db.prepare(
    "SELECT COUNT(*) as count FROM sermons WHERE author_id = ? AND status = 'ready'"
  ).get(userId) as { count: number }).count;

  const deliveredCount = (db.prepare(
    "SELECT COUNT(*) as count FROM sermons WHERE author_id = ? AND status = 'delivered'"
  ).get(userId) as { count: number }).count;

  const totalWords = (db.prepare(
    "SELECT COALESCE(SUM(LENGTH(content) - LENGTH(REPLACE(content, ' ', '')) + 1), 0) as count FROM sermons WHERE author_id = ? AND content != ''"
  ).get(userId) as { count: number }).count;

  const recentSermons = db.prepare(`
    SELECT s.id, s.title, s.status, s.content, s.scheduled_date, s.updated_at,
           t.name as theme_name, t.color as theme_color
    FROM sermons s
    LEFT JOIN themes t ON s.theme_id = t.id
    WHERE s.author_id = ?
    ORDER BY s.updated_at DESC
    LIMIT 5
  `).all(userId);

  const upcomingSermons = db.prepare(`
    SELECT id, title, scheduled_date, status
    FROM sermons
    WHERE author_id = ? AND scheduled_date >= date('now') AND status != 'delivered'
    ORDER BY scheduled_date ASC
    LIMIT 4
  `).all(userId);

  return NextResponse.json(toJSON({
    user,
    stats: {
      total: totalSermons,
      drafts: draftCount,
      ready: readyCount,
      delivered: deliveredCount,
      totalWords,
    },
    recentSermons,
    upcomingSermons,
  }));
}
