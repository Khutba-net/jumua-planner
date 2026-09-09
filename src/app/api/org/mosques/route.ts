import { NextResponse } from "next/server";
import { query, queryOne, cuid, toJSON } from "@/lib/db";
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

export async function GET() {
  let user;
  try { user = await getInstAdmin(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }
  if (!user) return NextResponse.json({ error: "Not an institution admin" }, { status: 403 });

  const mosques = await query(`
    SELECT m.*,
      (SELECT COUNT(*) FROM org_members om WHERE om.mosque_id = m.id AND om.role = 'khatib') as khatib_count,
      (SELECT COUNT(*) FROM org_members om WHERE om.mosque_id = m.id AND om.role = 'khatib' AND om.status = 'active') as active_khatib_count
    FROM mosques m
    WHERE m.organization_id = $1
    ORDER BY m.created_at ASC
  `, [user.organization_id]);

  return NextResponse.json(toJSON(mosques));
}

export async function POST(req: Request) {
  let user;
  try { user = await getInstAdmin(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }
  if (!user) return NextResponse.json({ error: "Not an institution admin" }, { status: 403 });

  const body = await req.json();
  const { name, address, city, country, capacity } = body;

  if (!name?.trim() || typeof name !== "string") {
    return NextResponse.json({ error: "Mosque name is required" }, { status: 400 });
  }
  if (name.trim().length > 200) {
    return NextResponse.json({ error: "Name is too long" }, { status: 400 });
  }

  const countRow = await queryOne<{ count: string }>(
    "SELECT COUNT(*) as count FROM mosques WHERE organization_id = $1", [user.organization_id]
  );
  if (Number(countRow?.count ?? 0) >= 20) {
    return NextResponse.json({ error: "Maximum 20 mosques reached" }, { status: 400 });
  }

  const id = cuid();
  await query(
    "INSERT INTO mosques (id, name, address, city, country, capacity, organization_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [id, name.trim().slice(0, 200), address?.trim()?.slice(0, 500) || null, city?.trim()?.slice(0, 100) || null, country?.trim()?.slice(0, 100) || null, capacity ? Math.max(0, Math.min(Number(capacity), 100000)) : null, user.organization_id]
  );

  const mosque = await queryOne("SELECT * FROM mosques WHERE id = $1", [id]);
  return NextResponse.json(toJSON(mosque), { status: 201 });
}
