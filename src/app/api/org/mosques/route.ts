import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { query, queryOne, cuid, toJSON } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";
import { sendMosqueInvitation } from "@/lib/email";
import { logger } from "@/lib/logger";

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
  let userId: string;
  let user;
  try {
    userId = await getUserId();
    user = await queryOne<{ id: string; organization_id: string | null; role: string; account_type: string; name: string }>(
      "SELECT id, organization_id, role, account_type, name FROM users WHERE id = $1", [userId]
    );
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }
  if (!user?.organization_id || user.role !== "admin" || user.account_type !== "institution") {
    return NextResponse.json({ error: "Not an institution admin" }, { status: 403 });
  }

  const body = await req.json();
  const { name, address, city, country, capacity, admin_email } = body;

  if (!name?.trim() || typeof name !== "string") {
    return NextResponse.json({ error: "Mosque name is required" }, { status: 400 });
  }
  if (name.trim().length > 200) {
    return NextResponse.json({ error: "Name is too long" }, { status: 400 });
  }

  const org = await queryOne<{ max_mosques: number | null }>(
    "SELECT max_mosques FROM organizations WHERE id = $1", [user.organization_id]
  );
  const maxMosques = org?.max_mosques ?? 20;
  const countRow = await queryOne<{ count: string }>(
    "SELECT COUNT(*) as count FROM mosques WHERE organization_id = $1", [user.organization_id]
  );
  if (Number(countRow?.count ?? 0) >= maxMosques) {
    return NextResponse.json({ error: `Maximum ${maxMosques} mosques reached` }, { status: 400 });
  }

  const id = cuid();
  const inviteCode = admin_email ? randomBytes(4).toString("hex") : null;
  const expiresAt = admin_email ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;

  await query(
    `INSERT INTO mosques (id, name, address, city, country, capacity, organization_id, admin_email, invite_code, invite_expires_at, invite_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      id,
      name.trim().slice(0, 200),
      address?.trim()?.slice(0, 500) || null,
      city?.trim()?.slice(0, 100) || null,
      country?.trim()?.slice(0, 100) || null,
      capacity ? Math.max(0, Math.min(Number(capacity), 100000)) : null,
      user.organization_id,
      admin_email?.trim()?.toLowerCase() || null,
      inviteCode,
      expiresAt,
      admin_email ? "invited" : "pending",
    ]
  );

  if (admin_email && typeof admin_email === "string" && process.env.RESEND_API_KEY) {
    const org = await queryOne<{ name: string }>("SELECT name FROM organizations WHERE id = $1", [user.organization_id]);
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3100";
    const inviteUrl = `${APP_URL}/mosque-invite/${inviteCode}`;
    await sendMosqueInvitation(
      admin_email.trim().toLowerCase(),
      user.name,
      name.trim(),
      org?.name ?? "your institution",
      inviteUrl
    ).catch((err) => logger.error("Failed to send mosque invitation email", { error: String(err) }));
  }

  const mosque = await queryOne("SELECT * FROM mosques WHERE id = $1", [id]);
  return NextResponse.json(toJSON(mosque), { status: 201 });
}
