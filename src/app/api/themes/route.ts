import { NextResponse } from "next/server";
import { db, cuid, toJSON } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();

  const themes = db.prepare(`
    SELECT t.*,
      (SELECT COUNT(*) FROM sub_topics WHERE theme_id = t.id) as sub_topic_count,
      (SELECT COUNT(*) FROM sermons WHERE theme_id = t.id) as sermon_count
    FROM themes t
    WHERE t.owner_id = ? OR t.organization_id IS NOT NULL
    ORDER BY t.year DESC, t.month ASC
  `).all(userId);

  const themesWithTopics = themes.map((theme: Record<string, unknown>) => {
    const subTopics = db.prepare(
      "SELECT * FROM sub_topics WHERE theme_id = ? ORDER BY week_number ASC"
    ).all(theme.id as string);
    return { ...theme, sub_topics: subTopics };
  });

  return NextResponse.json(toJSON(themesWithTopics));
}

export async function POST(req: Request) {
  const userId = await getUserId();
  const body = await req.json();
  const { name, description, month, year, color } = body;

  const id = cuid();
  db.prepare(
    "INSERT INTO themes (id, name, description, month, year, color, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, name, description ?? "", month, year, color ?? "#00666d", userId);

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

  return NextResponse.json(toJSON({ ...theme, sub_topics: subTopics }), { status: 201 });
}
