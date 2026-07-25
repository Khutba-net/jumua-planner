import { NextRequest, NextResponse } from "next/server";
import { db, cuid, toJSON } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { type, title, source, content } = body;

  if (!type || !title) {
    return NextResponse.json({ error: "Type and title are required" }, { status: 400 });
  }

  const refId = cuid();
  db.prepare(
    "INSERT INTO references_ (id, type, title, source, content, sermon_id) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(refId, type, title, source || null, content || null, id);

  const ref = db.prepare("SELECT * FROM references_ WHERE id = ?").get(refId);
  return NextResponse.json(toJSON(ref), { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const refId = url.searchParams.get("refId");

  if (!refId) {
    return NextResponse.json({ error: "refId is required" }, { status: 400 });
  }

  db.prepare("DELETE FROM references_ WHERE id = ? AND sermon_id = ?").run(refId, id);
  return NextResponse.json({ ok: true });
}
