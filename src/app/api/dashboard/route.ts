import { NextResponse } from "next/server";
import { query, queryOne, toJSON } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";
import { getEffectiveSubscription } from "@/lib/subscription";

export const dynamic = "force-dynamic";

function getThisFriday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = (5 - day + 7) % 7;
  const friday = new Date(now);
  friday.setDate(now.getDate() + (diff === 0 ? 0 : diff));
  return friday.toISOString().split("T")[0];
}

function countFridaysInYear(year: number): number {
  let count = 0;
  const d = new Date(year, 0, 1);
  while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
  while (d.getFullYear() === year) {
    count++;
    d.setDate(d.getDate() + 7);
  }
  return count;
}

function countFridaysFromDate(startDate: Date, year: number): number {
  let count = 0;
  const d = new Date(year, 0, 1);
  while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
  while (d.getFullYear() === year) {
    if (d >= startDate) count++;
    d.setDate(d.getDate() + 7);
  }
  return count;
}

function getLastFriday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day >= 5 ? day - 5 : day + 2;
  const lastFri = new Date(now);
  lastFri.setDate(now.getDate() - (diff === 0 && day === 5 ? 7 : diff));
  return lastFri.toISOString().split("T")[0];
}

export async function GET() {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }

  const user = await queryOne<Record<string, unknown>>(
    "SELECT id, name, email, account_type, role, organization_id, avatar_url, bio, phone, onboarding_complete, planning_year, created_at, is_platform_admin FROM users WHERE id = $1",
    [userId]
  );
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  if (!user.onboarding_complete) {
    return NextResponse.json({ error: "Onboarding incomplete", onboarding: false }, { status: 403 });
  }

  const today = new Date().toISOString().split("T")[0];
  const thisFriday = getThisFriday();
  const lastFriday = getLastFriday();

  const [totalRow, draftRow, readyRow, deliveredRow, wordsRow, recentSermons, upcomingSermons, thisFridaySermon, lastFridaySermon, backlogSermons] = await Promise.all([
    queryOne<{ count: string }>("SELECT COUNT(*) as count FROM sermons WHERE author_id = $1", [userId]),
    queryOne<{ count: string }>("SELECT COUNT(*) as count FROM sermons WHERE author_id = $1 AND status = 'draft'", [userId]),
    queryOne<{ count: string }>("SELECT COUNT(*) as count FROM sermons WHERE author_id = $1 AND status = 'ready'", [userId]),
    queryOne<{ count: string }>("SELECT COUNT(*) as count FROM sermons WHERE author_id = $1 AND status = 'delivered'", [userId]),
    queryOne<{ count: string }>(
      "SELECT COALESCE(SUM(LENGTH(content) - LENGTH(REPLACE(content, ' ', '')) + 1), 0) as count FROM sermons WHERE author_id = $1 AND content != ''",
      [userId]
    ),
    query(`
      SELECT s.id, s.title, s.status, s.content, s.scheduled_date, s.updated_at,
             t.name as theme_name, t.color as theme_color
      FROM sermons s
      LEFT JOIN themes t ON s.theme_id = t.id
      WHERE s.author_id = $1
      ORDER BY s.updated_at DESC
      LIMIT 5
    `, [userId]),
    query(`
      SELECT s.id, s.title, s.scheduled_date, s.status,
             t.name as theme_name
      FROM sermons s
      LEFT JOIN themes t ON s.theme_id = t.id
      WHERE s.author_id = $1 AND s.scheduled_date >= $2 AND s.status NOT IN ('delivered', 'skipped')
      ORDER BY s.scheduled_date ASC
      LIMIT 4
    `, [userId, today]),
    queryOne<Record<string, unknown>>(`
      SELECT s.id, s.title, s.status, s.scheduled_date, s.content,
             t.name as theme_name, t.color as theme_color
      FROM sermons s
      LEFT JOIN themes t ON s.theme_id = t.id
      WHERE s.author_id = $1 AND s.scheduled_date = $2 AND (s.type = 'friday' OR s.type IS NULL)
      LIMIT 1
    `, [userId, thisFriday]),
    queryOne<Record<string, unknown>>(`
      SELECT s.id, s.title, s.status, s.scheduled_date
      FROM sermons s
      WHERE s.author_id = $1 AND s.scheduled_date = $2 AND (s.type = 'friday' OR s.type IS NULL)
      LIMIT 1
    `, [userId, lastFriday]),
    query<{ id: string; title: string; status: string; scheduled_date: string; theme_name: string | null }>(`
      SELECT s.id, s.title, s.status, s.scheduled_date,
             t.name as theme_name
      FROM sermons s
      LEFT JOIN themes t ON s.theme_id = t.id
      WHERE s.author_id = $1 AND s.scheduled_date < $2 AND s.status NOT IN ('delivered', 'archived', 'skipped')
        AND (s.type = 'friday' OR s.type IS NULL)
      ORDER BY s.scheduled_date DESC
    `, [userId, today]),
  ]);

  const totalSermons = Number(totalRow?.count ?? 0);
  const draftCount = Number(draftRow?.count ?? 0);
  const readyCount = Number(readyRow?.count ?? 0);
  const deliveredCount = Number(deliveredRow?.count ?? 0);
  const totalWords = Number(wordsRow?.count ?? 0);
  const needsLastFridayLog = lastFridaySermon && lastFridaySermon.status !== "delivered" && lastFridaySermon.status !== "archived" && lastFridaySermon.status !== "skipped";
  const backlogCount = backlogSermons.length;

  const planningYear = (user.planning_year as number) || new Date().getFullYear();

  const [allThemes, planSermonStats, feedbackRow] = await Promise.all([
    query<{ id: string; name: string; month: number; year: number; sub_topic_count: string }>(`
      SELECT t.id, t.name, t.month, t.year,
             (SELECT COUNT(*) FROM sub_topics st WHERE st.theme_id = t.id) as sub_topic_count
      FROM themes t
      WHERE (t.owner_id = $1 OR t.organization_id IN (SELECT organization_id FROM users WHERE id = $2))
        AND t.year = $3
      ORDER BY t.month
    `, [userId, userId, planningYear]),
    queryOne<{ total: string; titled: string; delivered: string }>(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN s.title != 'Untitled Sermon' AND s.title != '' THEN 1 ELSE 0 END) as titled,
             SUM(CASE WHEN s.status = 'delivered' THEN 1 ELSE 0 END) as delivered
      FROM sermons s
      INNER JOIN themes t ON s.theme_id = t.id
      WHERE s.author_id = $1 AND t.year = $2
    `, [userId, planningYear]),
    queryOne<{ count: string }>(`
      SELECT COUNT(*) as count FROM feedback
      WHERE sermon_id IN (
        SELECT s.id FROM sermons s
        INNER JOIN themes t ON s.theme_id = t.id
        WHERE s.author_id = $1 AND t.year = $2
          AND s.status = 'delivered'
      )
    `, [userId, planningYear]),
  ]);

  const feedbackCount = Number(feedbackRow?.count ?? 0);
  const deliveredThisYear = Number(planSermonStats?.delivered ?? 0);

  const currentMonth = new Date().getMonth() + 1;
  const seasonDefs = [
    { label: "Season 1", months: [1, 2, 3] },
    { label: "Season 2", months: [4, 5, 6] },
    { label: "Season 3", months: [7, 8, 9] },
    { label: "Season 4", months: [10, 11, 12] },
  ];

  const themeIds = allThemes.map((t) => t.id);
  const themeSermonStats = themeIds.length > 0
    ? await query<{ theme_id: string; total: string; delivered: string }>(`
        SELECT theme_id, COUNT(*) as total,
               SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered
        FROM sermons WHERE author_id = $1 AND theme_id = ANY($2::text[])
        GROUP BY theme_id
      `, [userId, themeIds])
    : [];
  const themeStatsMap = new Map(themeSermonStats.map((s) => [s.theme_id, s]));

  const seasons = seasonDefs.map((def) => {
    const seasonThemes = allThemes.filter((t) => def.months.includes(t.month));
    let total = 0;
    let delivered = 0;
    for (const theme of seasonThemes) {
      const s = themeStatsMap.get(theme.id);
      if (s) { total += Number(s.total); delivered += Number(s.delivered); }
    }
    return {
      label: def.label,
      themes: seasonThemes.map((t) => t.name),
      totalSermons: total,
      deliveredSermons: delivered,
      progress: total > 0 ? Math.round((delivered / total) * 100) : 0,
      isCurrent: def.months.includes(currentMonth),
      isPast: def.months[def.months.length - 1] < currentMonth,
    };
  });

  const seasonsWithThemes = new Set(allThemes.map((t) => Math.floor((t.month - 1) / 3))).size;
  const subTopicsSet = allThemes.reduce((s, t) => s + Number(t.sub_topic_count), 0);

  const userCreatedAt = new Date(user.created_at as string);
  const joinedInPlanningYear = userCreatedAt.getFullYear() === planningYear;
  const effectiveFridays = joinedInPlanningYear
    ? countFridaysFromDate(userCreatedAt, planningYear)
    : countFridaysInYear(planningYear);

  let myAssignments: unknown[] = [];
  let orgName: string | null = null;
  if (user.organization_id) {
    const [org, member] = await Promise.all([
      queryOne<{ name: string }>("SELECT name FROM organizations WHERE id = $1", [user.organization_id as string]),
      queryOne<{ id: string }>(
        "SELECT id FROM org_members WHERE user_id = $1 AND organization_id = $2",
        [userId, user.organization_id as string]
      ),
    ]);
    orgName = org?.name || null;

    if (member) {
      myAssignments = await query(`
        SELECT fa.friday_date, fa.notes
        FROM friday_assignments fa
        WHERE fa.member_id = $1 AND fa.friday_date >= $2
        ORDER BY fa.friday_date ASC
        LIMIT 8
      `, [member.id, today]);
    }
  }

  const responseData: Record<string, unknown> = {
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
      titles: { done: Number(planSermonStats?.titled ?? 0), total: effectiveFridays },
      delivered: { done: deliveredThisYear, total: effectiveFridays },
      reviewed: { done: feedbackCount, total: deliveredThisYear || 1 },
    },
    planningYear,
    orgName,
    myAssignments,
    nextYearPrompt: null,
    subscription: await getEffectiveSubscription(userId),
  };

  const currentYear = new Date().getFullYear();
  const currentMonthNum = new Date().getMonth() + 1;
  if (currentMonthNum >= 10 && planningYear === currentYear) {
    const nextYear = currentYear + 1;
    const nextYearThemes = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM themes WHERE (owner_id = $1 OR organization_id IN (SELECT organization_id FROM users WHERE id = $2)) AND year = $3",
      [userId, userId, nextYear]
    );
    const hasThemes = Number(nextYearThemes?.count ?? 0) > 0;
    responseData.nextYearPrompt = { nextYear, hasThemes };
  }

  return NextResponse.json(toJSON(responseData));
}
