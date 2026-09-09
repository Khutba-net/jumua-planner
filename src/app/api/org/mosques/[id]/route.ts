import { NextResponse } from "next/server";
import { query, queryOne, exec, toJSON } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getInstAdmin() {
  const userId = await getUserId();
  const user = await queryOne<{ id: string; organization_id: string | null; role: string; account_type: string }>(
    "SELECT id, organization_id, role, account_type FROM users WHERE id = $1", [userId]
  );
  if (!user?.organization_id || user.role !== "admin" || user.account_type !== "institution") {
    return null;
  }
  return user;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try { user = await getInstAdmin(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }
  if (!user) return NextResponse.json({ error: "Not an institution admin" }, { status: 403 });

  const { id } = await params;
  const mosque = await queryOne(
    "SELECT * FROM mosques WHERE id = $1 AND organization_id = $2",
    [id, user.organization_id]
  );
  if (!mosque) return NextResponse.json({ error: "Mosque not found" }, { status: 404 });

  const members = await query(
    "SELECT id, name, email, role, status, user_id, invite_code, invite_expires_at, created_at FROM org_members WHERE mosque_id = $1 AND organization_id = $2 ORDER BY role = 'admin' DESC, created_at ASC",
    [id, user.organization_id]
  );

  const khatibStats = [];
  for (const m of members.filter((m) => m.role === "khatib" && m.user_id)) {
    const totalRow = await queryOne<{ c: string }>("SELECT COUNT(*) as c FROM sermons WHERE author_id = $1", [m.user_id]);
    const deliveredRow = await queryOne<{ c: string }>("SELECT COUNT(*) as c FROM sermons WHERE author_id = $1 AND status = 'delivered'", [m.user_id]);
    khatibStats.push({
      member_id: m.id,
      name: m.name,
      total_sermons: Number(totalRow?.c ?? 0),
      delivered_sermons: Number(deliveredRow?.c ?? 0),
    });
  }

  return NextResponse.json(toJSON({ mosque, members, khatibStats }));
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try { user = await getInstAdmin(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }
  if (!user) return NextResponse.json({ error: "Not an institution admin" }, { status: 403 });

  const { id } = await params;
  const existing = await queryOne(
    "SELECT id FROM mosques WHERE id = $1 AND organization_id = $2",
    [id, user.organization_id]
  );
  if (!existing) return NextResponse.json({ error: "Mosque not found" }, { status: 404 });

  const body = await req.json();
  const { name, address, city, country, capacity } = body;

  if (name !== undefined && (!name?.trim() || typeof name !== "string")) {
    return NextResponse.json({ error: "Mosque name is required" }, { status: 400 });
  }

  await exec(
    `UPDATE mosques SET
      name = COALESCE($1, name),
      address = COALESCE($2, address),
      city = COALESCE($3, city),
      country = COALESCE($4, country),
      capacity = COALESCE($5, capacity),
      updated_at = NOW()
    WHERE id = $6`,
    [name?.trim()?.slice(0, 200) || null, address?.trim()?.slice(0, 500) || null, city?.trim()?.slice(0, 100) || null, country?.trim()?.slice(0, 100) || null, capacity !== undefined ? Math.max(0, Math.min(Number(capacity), 100000)) : null, id]
  );

  const updated = await queryOne("SELECT * FROM mosques WHERE id = $1", [id]);
  return NextResponse.json(toJSON(updated));
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try { user = await getInstAdmin(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }
  if (!user) return NextResponse.json({ error: "Not an institution admin" }, { status: 403 });

  const { id } = await params;
  const existing = await queryOne(
    "SELECT id FROM mosques WHERE id = $1 AND organization_id = $2",
    [id, user.organization_id]
  );
  if (!existing) return NextResponse.json({ error: "Mosque not found" }, { status: 404 });

  // Unlink members and assignments from this mosque
  await exec("UPDATE org_members SET mosque_id = NULL WHERE mosque_id = $1", [id]);
  await exec("DELETE FROM friday_assignments WHERE mosque_id = $1", [id]);
  await exec("DELETE FROM mosques WHERE id = $1", [id]);

  return NextResponse.json({ ok: true });
}
