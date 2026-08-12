import { NextRequest, NextResponse } from "next/server";
import { db, toJSON } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }

  const { id } = await params;

  const sermon = db.prepare(`
    SELECT s.*, t.name as theme_name, t.color as theme_color,
           u.name as author_name
    FROM sermons s
    LEFT JOIN themes t ON s.theme_id = t.id
    LEFT JOIN users u ON s.author_id = u.id
    WHERE s.id = ? AND s.author_id = ?
  `).get(id, userId);

  if (!sermon) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const references = db
    .prepare("SELECT * FROM references_ WHERE sermon_id = ?")
    .all(id);

  return NextResponse.json(toJSON({ ...(sermon as Record<string, unknown>), references }));
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }

  const { id } = await params;

  const existing = db.prepare("SELECT id FROM sermons WHERE id = ? AND author_id = ?").get(id, userId);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const fields: string[] = [];
  const values: unknown[] = [];

  const validStatuses = ["draft", "ready", "delivered", "archived"];
  const validTypes = ["friday", "eid", "talk", "other"];

  if (body.title !== undefined) { fields.push("title = ?"); values.push(body.title); }
  if (body.content !== undefined) { fields.push("content = ?"); values.push(body.content); }
  if (body.outline !== undefined) { fields.push("outline = ?"); values.push(body.outline); }
  if (body.status !== undefined) { fields.push("status = ?"); values.push(validStatuses.includes(body.status) ? body.status : "draft"); }
  if (body.notes !== undefined) { fields.push("notes = ?"); values.push(body.notes); }
  if (body.type !== undefined) { fields.push("type = ?"); values.push(validTypes.includes(body.type) ? body.type : "friday"); }
  if (body.scheduledDate !== undefined) { fields.push("scheduled_date = ?"); values.push(body.scheduledDate || null); }
  if (body.themeId !== undefined) { fields.push("theme_id = ?"); values.push(body.themeId || null); }
  if (body.subTopicId !== undefined) { fields.push("sub_topic_id = ?"); values.push(body.subTopicId || null); }
  if (body.mosqueId !== undefined) { fields.push("mosque_id = ?"); values.push(body.mosqueId || null); }

  if (fields.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  fields.push("updated_at = datetime('now')");
  values.push(id);
  values.push(userId);

  db.prepare(`UPDATE sermons SET ${fields.join(", ")} WHERE id = ? AND author_id = ?`).run(...values);

  const sermon = db.prepare("SELECT * FROM sermons WHERE id = ?").get(id);
  return NextResponse.json(toJSON(sermon));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }

  const { id } = await params;

  const existing = db.prepare("SELECT id FROM sermons WHERE id = ? AND author_id = ?").get(id, userId);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.prepare("DELETE FROM references_ WHERE sermon_id = ?").run(id);
  db.prepare("DELETE FROM feedback WHERE sermon_id = ?").run(id);
  db.prepare("DELETE FROM sermons WHERE id = ? AND author_id = ?").run(id, userId);
  return NextResponse.json({ ok: true });
}
