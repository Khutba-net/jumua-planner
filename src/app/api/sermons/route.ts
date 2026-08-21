import { NextRequest, NextResponse } from "next/server";
import { query, cuid, toJSON } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let sql = `
    SELECT s.*, t.name as theme_name, t.color as theme_color,
           u.name as author_name
    FROM sermons s
    LEFT JOIN themes t ON s.theme_id = t.id
    LEFT JOIN users u ON s.author_id = u.id
    WHERE s.author_id = $1
  `;
  const params: unknown[] = [userId];

  if (status) {
    sql += " AND s.status = $2";
    params.push(status);
  }

  sql += " ORDER BY s.updated_at DESC";

  try {
    const sermons = await query(sql, params);
    return NextResponse.json(toJSON(sermons));
  } catch (err) {
    return NextResponse.json({ error: "Failed to load sermons", detail: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }

  const body = await req.json();
  const id = cuid();

  const validTypes = ["friday", "eid", "talk", "other"];
  const sermonType = validTypes.includes(body.type) ? body.type : "friday";

  try {
    await query(
      `INSERT INTO sermons (id, title, content, outline, status, type, scheduled_date, notes, author_id, mosque_id, theme_id, sub_topic_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id,
        body.title || "Untitled Sermon",
        body.content ?? "",
        body.outline ?? "",
        body.status ?? "draft",
        sermonType,
        body.scheduledDate ?? null,
        body.notes ?? "",
        userId,
        body.mosqueId ?? null,
        body.themeId ?? null,
        body.subTopicId ?? null,
      ]
    );
  } catch (err) {
    return NextResponse.json({ error: "Failed to create sermon", detail: String(err) }, { status: 500 });
  }

  const sermon = await query("SELECT * FROM sermons WHERE id = $1", [id]);
  return NextResponse.json(toJSON(sermon[0]), { status: 201 });
}
