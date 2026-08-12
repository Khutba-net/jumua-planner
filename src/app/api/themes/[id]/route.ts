import { NextResponse } from "next/server";
import { db, cuid, toJSON } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }

  const { id } = await params;
  const theme = db.prepare("SELECT * FROM themes WHERE id = ? AND owner_id = ?").get(id, userId);
  if (!theme) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const subTopics = db.prepare(
    "SELECT * FROM sub_topics WHERE theme_id = ? ORDER BY week_number ASC"
  ).all(id);

  const sermons = db.prepare(
    "SELECT id, title, status, scheduled_date FROM sermons WHERE theme_id = ? AND author_id = ? ORDER BY scheduled_date ASC"
  ).all(id, userId);

  return NextResponse.json(toJSON({ ...(theme as Record<string, unknown>), sub_topics: subTopics, sermons }));
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }

  const { id } = await params;

  const existing = db.prepare("SELECT id FROM themes WHERE id = ? AND owner_id = ?").get(id, userId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
    values.push(userId);
    db.prepare(`UPDATE themes SET ${fields.join(", ")} WHERE id = ? AND owner_id = ?`).run(...values);
  }

  if (body.subTopics && Array.isArray(body.subTopics)) {
    db.prepare("UPDATE sermons SET sub_topic_id = NULL WHERE sub_topic_id IN (SELECT id FROM sub_topics WHERE theme_id = ?)").run(id);
    db.prepare("DELETE FROM sub_topics WHERE theme_id = ?").run(id);
    const insert = db.prepare(
      "INSERT INTO sub_topics (id, name, week_number, theme_id) VALUES (?, ?, ?, ?)"
    );
    const newSubIds: string[] = [];
    for (const st of body.subTopics) {
      const subId = cuid();
      insert.run(subId, st.name, st.week, id);
      newSubIds.push(subId);
    }
    const allSermons = db.prepare("SELECT id, scheduled_date FROM sermons WHERE theme_id = ? AND author_id = ? AND sub_topic_id IS NULL ORDER BY scheduled_date ASC").all(id, userId) as { id: string; scheduled_date: string | null }[];
    for (const subId of newSubIds) {
      const batch = allSermons.splice(0, 4);
      for (const sr of batch) {
        db.prepare("UPDATE sermons SET sub_topic_id = ? WHERE id = ?").run(subId, sr.id);
      }
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
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }

  const { id } = await params;

  const existing = db.prepare("SELECT id FROM themes WHERE id = ? AND owner_id = ?").get(id, userId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  db.prepare("UPDATE sermons SET theme_id = NULL WHERE theme_id = ?").run(id);
  db.prepare("DELETE FROM sub_topics WHERE theme_id = ?").run(id);
  db.prepare("DELETE FROM themes WHERE id = ? AND owner_id = ?").run(id, userId);
  return NextResponse.json({ ok: true });
}
