import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, exec, cuid, toJSON } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";
import { referenceSchema, parseBody } from "@/lib/validations";

export const dynamic = "force-dynamic";

async function verifySermonOwnership(sermonId: string, userId: string) {
  return queryOne("SELECT id FROM sermons WHERE id = $1 AND author_id = $2", [sermonId, userId]);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: (e as AuthError).status });
    throw e;
  }

  const { id } = await params;

  if (!await verifySermonOwnership(id, userId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = parseBody(referenceSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { type, title, source, content } = parsed.data;

  const refId = cuid();
  await query(
    "INSERT INTO references_ (id, type, title, source, content, sermon_id) VALUES ($1, $2, $3, $4, $5, $6)",
    [refId, type, title, source || null, content || null, id]
  );

  const ref = await queryOne("SELECT * FROM references_ WHERE id = $1", [refId]);
  return NextResponse.json(toJSON(ref), { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: (e as AuthError).status });
    throw e;
  }

  const { id } = await params;

  if (!await verifySermonOwnership(id, userId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const refId = url.searchParams.get("refId");

  if (!refId) {
    return NextResponse.json({ error: "refId is required" }, { status: 400 });
  }

  await exec("DELETE FROM references_ WHERE id = $1 AND sermon_id = $2", [refId, id]);
  return NextResponse.json({ ok: true });
}
