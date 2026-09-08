import { NextResponse } from "next/server";
import { query, queryOne, exec, cuid, toJSON } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";
import { themeUpdateSchema, parseBody } from "@/lib/validations";

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
  const theme = await queryOne("SELECT * FROM themes WHERE id = $1 AND owner_id = $2", [id, userId]);
  if (!theme) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const subTopics = await query(
    "SELECT * FROM sub_topics WHERE theme_id = $1 ORDER BY week_number ASC",
    [id]
  );

  const sermons = await query(
    "SELECT id, title, status, scheduled_date FROM sermons WHERE theme_id = $1 AND author_id = $2 ORDER BY scheduled_date ASC",
    [id, userId]
  );

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

  const existing = await queryOne("SELECT id FROM themes WHERE id = $1 AND owner_id = $2", [id, userId]);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = parseBody(themeUpdateSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const d = parsed.data;

  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (d.name !== undefined) { fields.push(`name = $${paramIdx++}`); values.push(d.name); }
  if (d.description !== undefined) { fields.push(`description = $${paramIdx++}`); values.push(d.description); }
  if (d.month !== undefined) { fields.push(`month = $${paramIdx++}`); values.push(d.month); }
  if (d.color !== undefined) { fields.push(`color = $${paramIdx++}`); values.push(d.color); }

  if (fields.length > 0) {
    fields.push("updated_at = NOW()");
    values.push(id);
    values.push(userId);
    await exec(`UPDATE themes SET ${fields.join(", ")} WHERE id = $${paramIdx++} AND owner_id = $${paramIdx++}`, values);
  }

  if (d.subTopics && Array.isArray(d.subTopics)) {
    await exec("UPDATE sermons SET sub_topic_id = NULL WHERE sub_topic_id IN (SELECT id FROM sub_topics WHERE theme_id = $1)", [id]);
    await exec("DELETE FROM sub_topics WHERE theme_id = $1", [id]);
    const newSubIds: string[] = [];
    for (const st of d.subTopics) {
      const subId = cuid();
      await query(
        "INSERT INTO sub_topics (id, name, week_number, theme_id) VALUES ($1, $2, $3, $4)",
        [subId, st.name, st.week, id]
      );
      newSubIds.push(subId);
    }
    const allSermons = await query<{ id: string; scheduled_date: string | null }>(
      "SELECT id, scheduled_date FROM sermons WHERE theme_id = $1 AND author_id = $2 AND sub_topic_id IS NULL ORDER BY scheduled_date ASC",
      [id, userId]
    );
    for (const subId of newSubIds) {
      const batch = allSermons.splice(0, 4);
      for (const sr of batch) {
        await exec("UPDATE sermons SET sub_topic_id = $1 WHERE id = $2", [subId, sr.id]);
      }
    }
  }

  const theme = await queryOne("SELECT * FROM themes WHERE id = $1", [id]);
  const subTopics = await query(
    "SELECT * FROM sub_topics WHERE theme_id = $1 ORDER BY week_number ASC",
    [id]
  );

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

  const existing = await queryOne("SELECT id FROM themes WHERE id = $1 AND owner_id = $2", [id, userId]);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await exec("UPDATE sermons SET theme_id = NULL, sub_topic_id = NULL WHERE theme_id = $1", [id]);
  await exec("DELETE FROM sub_topics WHERE theme_id = $1", [id]);
  await exec("DELETE FROM themes WHERE id = $1 AND owner_id = $2", [id, userId]);
  return NextResponse.json({ ok: true });
}
