import { NextResponse } from "next/server";
import { query, queryOne, cuid, toJSON } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";
import { themeCreateSchema, parseBody } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: (e as AuthError).status });
    throw e;
  }

  const user = await queryOne<{ organization_id: string | null; role: string }>(
    "SELECT organization_id, role FROM users WHERE id = $1", [userId]
  );

  const themes = await query(`
    SELECT t.*,
      (SELECT COUNT(*) FROM sub_topics WHERE theme_id = t.id) as sub_topic_count,
      (SELECT COUNT(*) FROM sermons WHERE theme_id = t.id) as sermon_count
    FROM themes t
    WHERE t.owner_id = $1 OR (t.organization_id = $2 AND t.organization_id IS NOT NULL)
    ORDER BY t.year DESC, t.month ASC
  `, [userId, user?.organization_id || ""]);

  const themeIds = themes.map(t => t.id as string);
  let allSubTopics: Record<string, unknown>[] = [];
  if (themeIds.length > 0) {
    const placeholders = themeIds.map((_, i) => `$${i + 1}`).join(",");
    allSubTopics = await query(
      `SELECT * FROM sub_topics WHERE theme_id IN (${placeholders}) ORDER BY week_number ASC`,
      themeIds
    );
  }

  const themesWithTopics = themes.map((theme) => ({
    ...theme,
    sub_topics: allSubTopics.filter(st => st.theme_id === theme.id),
  }));

  return NextResponse.json(toJSON(themesWithTopics));
}

export async function POST(req: Request) {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: (e as AuthError).status });
    throw e;
  }

  const admin = await queryOne<{ organization_id: string | null; role: string }>(
    "SELECT organization_id, role FROM users WHERE id = $1", [userId]
  );

  const body = await req.json();
  const parsed = parseBody(themeCreateSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { name, description, month, year, color, mosqueId } = parsed.data;

  const isOrgAdmin = admin?.role === "admin" && admin?.organization_id;
  const id = cuid();
  await query(
    "INSERT INTO themes (id, name, description, month, year, color, owner_id, organization_id, mosque_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    [id, name, description ?? "", month, year, color ?? "#00666d", userId, isOrgAdmin ? admin.organization_id : null, mosqueId || null]
  );

  if (parsed.data.subTopics && Array.isArray(parsed.data.subTopics)) {
    for (const st of parsed.data.subTopics) {
      await query(
        "INSERT INTO sub_topics (id, name, week_number, theme_id) VALUES ($1, $2, $3, $4)",
        [cuid(), st.name, st.week, id]
      );
    }
  }

  const theme = await queryOne("SELECT * FROM themes WHERE id = $1", [id]);
  const subTopics = await query(
    "SELECT * FROM sub_topics WHERE theme_id = $1 ORDER BY week_number ASC",
    [id]
  );

  return NextResponse.json(toJSON({ ...(theme as Record<string, unknown>), sub_topics: subTopics }), { status: 201 });
}
