import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, exec, toJSON } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";
import { sermonUpdateSchema, parseBody } from "@/lib/validations";

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

  const sermon = await queryOne(`
    SELECT s.*, t.name as theme_name, t.color as theme_color,
           u.name as author_name
    FROM sermons s
    LEFT JOIN themes t ON s.theme_id = t.id
    LEFT JOIN users u ON s.author_id = u.id
    WHERE s.id = $1 AND s.author_id = $2
  `, [id, userId]);

  if (!sermon) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const references = await query("SELECT * FROM references_ WHERE sermon_id = $1", [id]);

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

  const existing = await queryOne<{ id: string; updated_at: string }>("SELECT id, updated_at FROM sermons WHERE id = $1 AND author_id = $2", [id, userId]);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = parseBody(sermonUpdateSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const d = parsed.data;

  if (d.lastUpdated) {
    const clientTime = new Date(d.lastUpdated).getTime();
    const serverTime = new Date(existing.updated_at).getTime();
    if (serverTime > clientTime) {
      return NextResponse.json({ error: "conflict", serverUpdatedAt: existing.updated_at }, { status: 409 });
    }
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (d.title !== undefined) { fields.push(`title = $${paramIdx++}`); values.push(d.title); }
  if (d.content !== undefined) { fields.push(`content = $${paramIdx++}`); values.push(d.content); }
  if (d.outline !== undefined) { fields.push(`outline = $${paramIdx++}`); values.push(d.outline); }
  if (d.status !== undefined) { fields.push(`status = $${paramIdx++}`); values.push(d.status); }
  if (d.notes !== undefined) { fields.push(`notes = $${paramIdx++}`); values.push(d.notes); }
  if (d.type !== undefined) { fields.push(`type = $${paramIdx++}`); values.push(d.type); }
  if (d.scheduledDate !== undefined) { fields.push(`scheduled_date = $${paramIdx++}`); values.push(d.scheduledDate || null); }
  if (d.themeId !== undefined) {
    if (d.isOverride) {
      const current = await queryOne<{ theme_id: string | null; original_theme_id: string | null }>("SELECT theme_id, original_theme_id FROM sermons WHERE id = $1", [id]);
      if (current && !current.original_theme_id && current.theme_id) {
        fields.push(`original_theme_id = $${paramIdx++}`); values.push(current.theme_id);
      }
      fields.push(`is_override = $${paramIdx++}`); values.push(1);
    } else if (d.isOverride === false) {
      fields.push(`original_theme_id = $${paramIdx++}`); values.push(null);
      fields.push(`is_override = $${paramIdx++}`); values.push(0);
    }
    fields.push(`theme_id = $${paramIdx++}`); values.push(d.themeId || null);
  }
  if (d.subTopicId !== undefined) { fields.push(`sub_topic_id = $${paramIdx++}`); values.push(d.subTopicId || null); }
  if (d.mosqueId !== undefined) { fields.push(`mosque_id = $${paramIdx++}`); values.push(d.mosqueId || null); }
  if (d.language !== undefined) { fields.push(`language = $${paramIdx++}`); values.push(d.language); }
  if (d.translationOf !== undefined) { fields.push(`translation_of = $${paramIdx++}`); values.push(d.translationOf || null); }

  if (fields.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  fields.push("updated_at = NOW()");
  values.push(id);
  values.push(userId);

  await exec(`UPDATE sermons SET ${fields.join(", ")} WHERE id = $${paramIdx++} AND author_id = $${paramIdx++}`, values);

  const sermon = await queryOne("SELECT * FROM sermons WHERE id = $1", [id]);
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

  const existing = await queryOne("SELECT id FROM sermons WHERE id = $1 AND author_id = $2", [id, userId]);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await exec("DELETE FROM references_ WHERE sermon_id = $1", [id]);
  await exec("DELETE FROM feedback WHERE sermon_id = $1", [id]);
  await exec("DELETE FROM sermons WHERE id = $1 AND author_id = $2", [id, userId]);
  return NextResponse.json({ ok: true });
}
