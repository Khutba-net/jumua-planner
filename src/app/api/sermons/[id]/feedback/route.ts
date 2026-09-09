import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, exec, cuid, toJSON } from "@/lib/db";
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
  const sermon = await queryOne("SELECT id FROM sermons WHERE id = $1 AND author_id = $2", [id, userId]);
  if (!sermon) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const feedback = await queryOne("SELECT * FROM feedback WHERE sermon_id = $1", [id]);
  return NextResponse.json(toJSON(feedback ?? null));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }

  const { id } = await params;
  const sermon = await queryOne("SELECT id FROM sermons WHERE id = $1 AND author_id = $2", [id, userId]);
  if (!sermon) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const rating = typeof body.rating === "number" && body.rating >= 1 && body.rating <= 5 ? body.rating : null;
  const attendance = typeof body.attendance === "number" && body.attendance >= 0 ? body.attendance : null;
  const comment = typeof body.comment === "string" ? body.comment.slice(0, 2000) : null;

  const existing = await queryOne("SELECT id FROM feedback WHERE sermon_id = $1", [id]);
  if (existing) {
    await exec(
      "UPDATE feedback SET rating = COALESCE($1, rating), attendance = COALESCE($2, attendance), comment = COALESCE($3, comment) WHERE sermon_id = $4",
      [rating, attendance, comment, id]
    );
  } else {
    await exec(
      "INSERT INTO feedback (id, rating, attendance, comment, sermon_id) VALUES ($1, $2, $3, $4, $5)",
      [cuid(), rating, attendance, comment, id]
    );
  }

  const feedback = await queryOne("SELECT * FROM feedback WHERE sermon_id = $1", [id]);
  return NextResponse.json(toJSON(feedback));
}
