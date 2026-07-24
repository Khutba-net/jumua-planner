import { NextResponse } from "next/server";
import { db, cuid, toJSON } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const theme = db.prepare("SELECT * FROM themes WHERE id = ?").get(id);
  if (!theme) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const subTopics = db.prepare(
    "SELECT * FROM sub_topics WHERE theme_id = ? ORDER BY week_number ASC"
  ).all(id);

  const sermons = db.prepare(
    "SELECT id, title, status, scheduled_date FROM sermons WHERE theme_id = ? ORDER BY scheduled_date ASC"
  ).all(id);

  return NextResponse.json(toJSON({ ...(theme as Record<string, unknown>), sub_topics: subTopics, sermons }));
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const fields: string[] = [];
  const values: unknown[] = [];

  if (body.name !== undefined) { fields.push("name = ?"); values.push(body.name); }
  if (body.description !== undefined) { fields.push("description = ?"); values.push(body.description); }
  if (body.month !== undefined) { fields.push("month = ?"); values.push(body.month); }
  if (body.color !== undefined) { fields.push("color = ?"); values.push(body.color); }

  if (fields.length > 0) {
    fields.push("updated_at = datetime('now')");
    values.push(id);
    db.prepare(`UPDATE themes SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  }

  if (body.subTopics && Array.isArray(body.subTopics)) {
    db.prepare("DELETE FROM sub_topics WHERE theme_id = ?").run(id);
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

  return NextResponse.json(toJSON({ ...(theme as Record<string, unknown>), sub_topics: subTopics }));
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.prepare("UPDATE sermons SET theme_id = NULL WHERE theme_id = ?").run(id);
  db.prepare("DELETE FROM sub_topics WHERE theme_id = ?").run(id);
  db.prepare("DELETE FROM themes WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
