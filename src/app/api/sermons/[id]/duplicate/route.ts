import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, cuid, toJSON } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: (e as AuthError).status });
    throw e;
  }

  const { id: sourceId } = await params;

  const source = await queryOne<Record<string, unknown>>(
    "SELECT * FROM sermons WHERE id = $1 AND author_id = $2",
    [sourceId, userId]
  );
  if (!source) {
    return NextResponse.json({ error: "Sermon not found" }, { status: 404 });
  }

  const newId = cuid();
  await query(
    `INSERT INTO sermons (id, title, content, outline, status, type, notes, author_id, mosque_id, theme_id, sub_topic_id)
     VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7, $8, $9, $10)`,
    [
      newId,
      source.title as string,
      source.content as string,
      source.outline as string ?? "",
      source.type as string ?? "friday",
      source.notes as string ?? "",
      userId,
      source.mosque_id ?? null,
      null,
      null,
    ]
  );

  const refs = await query<Record<string, unknown>>(
    "SELECT * FROM references_ WHERE sermon_id = $1",
    [sourceId]
  );
  for (const ref of refs) {
    await query(
      "INSERT INTO references_ (id, type, title, source, url, content, sermon_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [cuid(), ref.type, ref.title, ref.source, ref.url ?? null, ref.content, newId]
    );
  }

  const sermon = await queryOne("SELECT * FROM sermons WHERE id = $1", [newId]);
  return NextResponse.json(toJSON(sermon), { status: 201 });
}
