import { NextRequest, NextResponse } from "next/server";
import { db, cuid, toJSON } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const authorId = searchParams.get("authorId");

  let sql = `
    SELECT s.*, t.name as theme_name, t.color as theme_color,
           u.name as author_name
    FROM sermons s
    LEFT JOIN themes t ON s.theme_id = t.id
    LEFT JOIN users u ON s.author_id = u.id
  `;
  const conditions: string[] = [];
  const params: string[] = [];

  if (status) {
    conditions.push("s.status = ?");
    params.push(status);
  }
  if (authorId) {
    conditions.push("s.author_id = ?");
    params.push(authorId);
  }

  if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
  sql += " ORDER BY s.updated_at DESC";

  const sermons = db.prepare(sql).all(...params);
  return NextResponse.json(toJSON(sermons));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = cuid();

  db.prepare(`
    INSERT INTO sermons (id, title, content, outline, status, scheduled_date, notes, author_id, mosque_id, theme_id, sub_topic_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    body.title || "Untitled Sermon",
    body.content ?? "",
    body.outline ?? "",
    body.status ?? "draft",
    body.scheduledDate ?? null,
    body.notes ?? "",
    body.authorId ?? await getUserId(),
    body.mosqueId ?? null,
    body.themeId ?? null,
    body.subTopicId ?? null
  );

  const sermon = db.prepare("SELECT * FROM sermons WHERE id = ?").get(id);
  return NextResponse.json(toJSON(sermon), { status: 201 });
}
