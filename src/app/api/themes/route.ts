import { NextResponse } from "next/server";
import { db, cuid, toJSON } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }

  const user = db.prepare("SELECT organization_id, role FROM users WHERE id = ?").get(userId) as { organization_id: string | null; role: string } | undefined;

  const themes = db.prepare(`
    SELECT t.*,
      (SELECT COUNT(*) FROM sub_topics WHERE theme_id = t.id) as sub_topic_count,
      (SELECT COUNT(*) FROM sermons WHERE theme_id = t.id) as sermon_count
    FROM themes t
    WHERE t.owner_id = ? OR (t.organization_id = ? AND t.organization_id IS NOT NULL)
    ORDER BY t.year DESC, t.month ASC
  `).all(userId, user?.organization_id || "");

  const themeIds = (themes as { id: string }[]).map(t => t.id);
  let allSubTopics: Record<string, unknown>[] = [];
  if (themeIds.length > 0) {
    const placeholders = themeIds.map(() => "?").join(",");
    allSubTopics = db.prepare(
      `SELECT * FROM sub_topics WHERE theme_id IN (${placeholders}) ORDER BY week_number ASC`
    ).all(...themeIds) as Record<string, unknown>[];
  }

  const themesWithTopics = (themes as Record<string, unknown>[]).map((theme) => ({
    ...theme,
    sub_topics: allSubTopics.filter(st => st.theme_id === theme.id),
  }));

  return NextResponse.json(toJSON(themesWithTopics));
}

export async function POST(req: Request) {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }

  const admin = db.prepare("SELECT organization_id, role FROM users WHERE id = ?").get(userId) as { organization_id: string | null; role: string } | undefined;

  const body = await req.json();
  const { name, description, month, year, color } = body;

  const isOrgAdmin = admin?.role === "admin" && admin?.organization_id;
  const id = cuid();
  db.prepare(
    "INSERT INTO themes (id, name, description, month, year, color, owner_id, organization_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, name, description ?? "", month, year, color ?? "#00666d", userId, isOrgAdmin ? admin.organization_id : null);

  if (body.subTopics && Array.isArray(body.subTopics)) {
    const insert = db.prepare(
      "INSERT INTO sub_topics (id, name, week_number, theme_id) VALUES (?, ?, ?, ?)"
    );
    for (const st of body.subTopics) {
      insert.run(cuid(), st.name, st.week, id);
    }
  }

  const theme = db.prepare("SELECT * FROM themes WHERE id = ?").get(id);
  const subTopics = db.prepare(
    "SELECT * FROM sub_topics WHERE theme_id = ? ORDER BY week_number ASC"
  ).all(id);

  return NextResponse.json(toJSON({ ...(theme as Record<string, unknown>), sub_topics: subTopics }), { status: 201 });
}
