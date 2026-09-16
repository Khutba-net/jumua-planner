import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/admin";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePlatformAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const totalUsers = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM users"
    );
    const byPlan = await query<{ account_type: string; count: string }>(
      "SELECT account_type, COUNT(*) as count FROM users GROUP BY account_type ORDER BY count DESC"
    );
    const totalOrgs = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM organizations"
    );
    const orgsByType = await query<{ type: string; count: string }>(
      "SELECT type, COUNT(*) as count FROM organizations GROUP BY type ORDER BY count DESC"
    );
    const totalSermons = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM sermons"
    );
    const sermonsByStatus = await query<{ status: string; count: string }>(
      "SELECT status, COUNT(*) as count FROM sermons GROUP BY status ORDER BY count DESC"
    );
    const totalMosques = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM mosques"
    );
    const recentUsers = await query<{
      id: string; name: string; email: string; account_type: string;
      role: string; created_at: string; is_platform_admin: number;
    }>(
      "SELECT id, name, email, account_type, role, created_at, is_platform_admin FROM users ORDER BY created_at DESC LIMIT 10"
    );
    const activeThisWeek = await queryOne<{ count: string }>(
      "SELECT COUNT(DISTINCT author_id) as count FROM sermons WHERE updated_at > NOW() - INTERVAL '7 days'"
    );
    const signupsThisWeek = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE created_at > NOW() - INTERVAL '7 days'"
    );

    return NextResponse.json({
      totalUsers: Number(totalUsers?.count ?? 0),
      byPlan: byPlan.map(r => ({ plan: r.account_type, count: Number(r.count) })),
      totalOrgs: Number(totalOrgs?.count ?? 0),
      orgsByType: orgsByType.map(r => ({ type: r.type, count: Number(r.count) })),
      totalSermons: Number(totalSermons?.count ?? 0),
      sermonsByStatus: sermonsByStatus.map(r => ({ status: r.status, count: Number(r.count) })),
      totalMosques: Number(totalMosques?.count ?? 0),
      recentUsers,
      activeThisWeek: Number(activeThisWeek?.count ?? 0),
      signupsThisWeek: Number(signupsThisWeek?.count ?? 0),
    });
  } catch (e) {
    logger.error("Admin: failed to load stats", { error: String(e) });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
