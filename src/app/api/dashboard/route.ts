import { NextResponse } from "next/server";
import { db, toJSON } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getThisFriday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = (5 - day + 7) % 7;
  const friday = new Date(now);
  friday.setDate(now.getDate() + (diff === 0 ? 0 : diff));
  return friday.toISOString().split("T")[0];
}

function getLastFriday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day >= 5 ? day - 5 : day + 2;
  const lastFri = new Date(now);
  lastFri.setDate(now.getDate() - (diff === 0 && day === 5 ? 7 : diff));
  return lastFri.toISOString().split("T")[0];
}

function getSeasonLabel(month: number): string {
  if (month >= 1 && month <= 3) return "Winter";
  if (month >= 4 && month <= 6) return "Spring";
  if (month >= 7 && month <= 9) return "Summer";
  return "Fall";
}

export async function GET() {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }

  const user = db.prepare("SELECT id, name, email, account_type, role, avatar_url, bio, phone, onboarding_complete, planning_year, created_at FROM users WHERE id = ?").get(userId) as Record<string, unknown> | undefined;
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  if (!user.onboarding_complete) {
    return NextResponse.json({ error: "Onboarding incomplete", onboarding: false }, { status: 403 });
  }

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
    SELECT s.id, s.title, s.scheduled_date, s.status,
           t.name as theme_name
    FROM sermons s
    LEFT JOIN themes t ON s.theme_id = t.id
    WHERE s.author_id = ? AND s.scheduled_date >= date('now') AND s.status != 'delivered'
    ORDER BY s.scheduled_date ASC
    LIMIT 4
  `).all(userId);

  const thisFriday = getThisFriday();
  const thisFridaySermon = db.prepare(`
    SELECT s.id, s.title, s.status, s.scheduled_date, s.content,
           t.name as theme_name, t.color as theme_color
    FROM sermons s
    LEFT JOIN themes t ON s.theme_id = t.id
    WHERE s.author_id = ? AND s.scheduled_date = ? AND (s.type = 'friday' OR s.type IS NULL)
    LIMIT 1
  `).get(userId, thisFriday) as Record<string, unknown> | undefined;

  const lastFriday = getLastFriday();
  const lastFridaySermon = db.prepare(`
    SELECT s.id, s.title, s.status, s.scheduled_date
    FROM sermons s
    WHERE s.author_id = ? AND s.scheduled_date = ? AND (s.type = 'friday' OR s.type IS NULL)
    LIMIT 1
  `).get(userId, lastFriday) as Record<string, unknown> | undefined;

  const needsLastFridayLog = lastFridaySermon && lastFridaySermon.status !== "delivered" && lastFridaySermon.status !== "archived";

  const backlogSermons = db.prepare(`
    SELECT s.id, s.title, s.status, s.scheduled_date,
           t.name as theme_name
    FROM sermons s
    LEFT JOIN themes t ON s.theme_id = t.id
    WHERE s.author_id = ? AND s.scheduled_date < date('now') AND s.status NOT IN ('delivered', 'archived')
      AND (s.type = 'friday' OR s.type IS NULL)
    ORDER BY s.scheduled_date DESC
  `).all(userId) as { id: string; title: string; status: string; scheduled_date: string; theme_name: string | null }[];
  const backlogCount = backlogSermons.length;

  const planningYear = (user.planning_year as number) || new Date().getFullYear();
  const allThemes = db.prepare(`
    SELECT t.id, t.name, t.month, t.year,
           (SELECT COUNT(*) FROM sub_topics st WHERE st.theme_id = t.id) as sub_topic_count
    FROM themes t
    WHERE (t.owner_id = ? OR t.organization_id IN (SELECT organization_id FROM users WHERE id = ?))
      AND t.year = ?
    ORDER BY t.month
  `).all(userId, userId, planningYear) as { id: string; name: string; month: number; year: number; sub_topic_count: number }[];

  const currentMonth = new Date().getMonth() + 1;
  const seasons = [
    { label: "Season 1", months: [1, 2, 3] },
    { label: "Season 2", months: [4, 5, 6] },
    { label: "Season 3", months: [7, 8, 9] },
    { label: "Season 4", months: [10, 11, 12] },
  ].map((season) => {
    const seasonThemes = allThemes.filter((t) => season.months.includes(t.month));
    const themesWithSermons = seasonThemes.map((theme) => {
      const sermonStats = db.prepare(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered
        FROM sermons WHERE author_id = ? AND theme_id = ?
      `).get(userId, theme.id) as { total: number; delivered: number };
      return { ...theme, sermonTotal: sermonStats.total, sermonDelivered: sermonStats.delivered };
    });
    const totalSermons = themesWithSermons.reduce((s, t) => s + t.sermonTotal, 0);
    const deliveredSermons = themesWithSermons.reduce((s, t) => s + t.sermonDelivered, 0);
    const isCurrent = season.months.includes(currentMonth);
    return {
      label: season.label,
      themes: themesWithSermons.map((t) => t.name),
      totalSermons,
      deliveredSermons,
      progress: totalSermons > 0 ? Math.round((deliveredSermons / totalSermons) * 100) : 0,
      isCurrent,
    };
  });

  const seasonsWithThemes = new Set(allThemes.map((t) => Math.floor((t.month - 1) / 3))).size;
  const subTopicsSet = allThemes.reduce((s, t) => s + t.sub_topic_count, 0);

  const yearStart = `${planningYear}-01-01`;
  const yearEnd = `${planningYear}-12-31`;
  const planSermonStats = db.prepare(`
    SELECT COUNT(*) as total,
           SUM(CASE WHEN s.title != 'Untitled Sermon' AND s.title != '' THEN 1 ELSE 0 END) as titled,
           SUM(CASE WHEN s.status = 'delivered' THEN 1 ELSE 0 END) as delivered
    FROM sermons s
    INNER JOIN themes t ON s.theme_id = t.id
    WHERE s.author_id = ? AND t.year = ?
  `).get(userId, planningYear) as { total: number; titled: number; delivered: number };

  const feedbackCount = (db.prepare(`
    SELECT COUNT(*) as count FROM feedback
    WHERE sermon_id IN (
      SELECT s.id FROM sermons s
      INNER JOIN themes t ON s.theme_id = t.id
      WHERE s.author_id = ? AND t.year = ?
        AND s.status = 'delivered'
    )
  `).get(userId, planningYear) as { count: number }).count;

  const deliveredThisYear = planSermonStats.delivered;

  let myAssignments: unknown[] = [];
  let orgName: string | null = null;
  if (user.organization_id) {
    const org = db.prepare("SELECT name FROM organizations WHERE id = ?").get(user.organization_id as string) as { name: string } | undefined;
    orgName = org?.name || null;

    const member = db.prepare(
      "SELECT id FROM org_members WHERE user_id = ? AND organization_id = ?"
    ).get(userId, user.organization_id as string) as { id: string } | undefined;

    if (member) {
      myAssignments = db.prepare(`
        SELECT fa.friday_date, fa.notes
        FROM friday_assignments fa
        WHERE fa.member_id = ? AND fa.friday_date >= date('now')
        ORDER BY fa.friday_date ASC
        LIMIT 8
      `).all(member.id);
    }
  }

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
    thisFriday: {
      date: thisFriday,
      sermon: thisFridaySermon ?? null,
    },
    lastFriday: needsLastFridayLog ? {
      date: lastFriday,
      sermon: lastFridaySermon,
    } : null,
    backlogCount,
    backlogSermons,
    seasons,
    checklist: {
      themes: { done: seasonsWithThemes, total: 4 },
      subTopics: { done: subTopicsSet, total: 16 },
      titles: { done: planSermonStats.titled, total: 52 },
      delivered: { done: deliveredThisYear, total: 52 },
      reviewed: { done: feedbackCount, total: deliveredThisYear || 1 },
    },
    planningYear,
    orgName,
    myAssignments,
  }));
}
