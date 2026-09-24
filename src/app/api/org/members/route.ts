import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { query, queryOne, cuid, toJSON } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";
import { sendInvitation } from "@/lib/email";
import { logger } from "@/lib/logger";
import { orgMemberCreateSchema, parseBody } from "@/lib/validations";

export const dynamic = "force-dynamic";

async function getAdminUser() {
  const userId = await getUserId();
  const user = await queryOne<{ id: string; organization_id: string | null; role: string; name: string }>(
    "SELECT id, organization_id, role, name FROM users WHERE id = $1", [userId]
  );
  if (!user?.organization_id || (user.role !== "admin" && user.role !== "mosque_admin")) {
    return null;
  }
  let mosqueId: string | null = null;
  if (user.role === "mosque_admin") {
    const mosque = await queryOne<{ id: string }>(
      "SELECT id FROM mosques WHERE admin_user_id = $1 AND organization_id = $2",
      [userId, user.organization_id]
    );
    if (!mosque) return null;
    mosqueId = mosque.id;
  }
  return { ...user, mosqueId };
}

export async function GET() {
  let user;
  try { user = await getAdminUser(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }
  if (!user) return NextResponse.json({ error: "Not an org admin" }, { status: 403 });

  const mosqueFilter = user.mosqueId ? " AND om.mosque_id = $2" : "";
  const params: (string | null)[] = [user.organization_id!];
  if (user.mosqueId) params.push(user.mosqueId);

  const members = await query(
    `SELECT om.id, om.name, om.email, om.role, om.status, om.invite_code, om.invite_expires_at, om.created_at, om.mosque_id,
            m.name as mosque_name
     FROM org_members om
     LEFT JOIN mosques m ON m.id = om.mosque_id
     WHERE om.organization_id = $1${mosqueFilter} ORDER BY om.role = 'admin' DESC, om.created_at ASC`,
    params
  );

  return NextResponse.json(toJSON(members));
}

export async function POST(req: Request) {
  let user;
  try { user = await getAdminUser(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }
  if (!user) return NextResponse.json({ error: "Not an org admin" }, { status: 403 });

  const org = await queryOne<{ max_khatibs: number | null }>(
    "SELECT max_khatibs FROM organizations WHERE id = $1", [user.organization_id!]
  );
  const maxMembers = (org?.max_khatibs ?? 10) + 1;
  const countRow = await queryOne<{ count: string }>(
    "SELECT COUNT(*) as count FROM org_members WHERE organization_id = $1", [user.organization_id!]
  );
  if (Number(countRow?.count ?? 0) >= maxMembers) {
    return NextResponse.json({ error: `Maximum ${org?.max_khatibs ?? 10} khatibs reached` }, { status: 400 });
  }

  const body = await req.json();
  const parsed = parseBody(orgMemberCreateSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { name, mosque_id: bodyMosqueId, email: inviteEmail } = parsed.data as { name: string; mosque_id?: string; email?: string };

  const effectiveMosqueId = user.mosqueId || bodyMosqueId || null;

  if (effectiveMosqueId && !user.mosqueId) {
    const mosque = await queryOne("SELECT id FROM mosques WHERE id = $1 AND organization_id = $2", [effectiveMosqueId, user.organization_id!]);
    if (!mosque) return NextResponse.json({ error: "Mosque not found" }, { status: 400 });
  }

  const inviteCode = randomBytes(4).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const id = cuid();

  await query(
    "INSERT INTO org_members (id, organization_id, mosque_id, name, role, status, invite_code, invite_expires_at) VALUES ($1, $2, $3, $4, 'khatib', 'invited', $5, $6)",
    [id, user.organization_id!, effectiveMosqueId, name.trim().slice(0, 100), inviteCode, expiresAt]
  );

  const member = await queryOne("SELECT * FROM org_members WHERE id = $1", [id]);

  if (inviteEmail && typeof inviteEmail === "string" && process.env.RESEND_API_KEY) {
    const org = await queryOne<{ name: string }>("SELECT name FROM organizations WHERE id = $1", [user.organization_id!]);
    const mosqueName = effectiveMosqueId ? (await queryOne<{ name: string }>("SELECT name FROM mosques WHERE id = $1", [effectiveMosqueId]))?.name : null;
    const orgLabel = mosqueName ? `${org?.name ?? "your organization"} — ${mosqueName}` : (org?.name ?? "your organization");
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3100";
    const inviteUrl = `${APP_URL}/invite/${inviteCode}`;
    await sendInvitation(inviteEmail.trim(), user.name ?? "Admin", orgLabel, inviteUrl).catch((err) =>
      logger.error("Failed to send invitation email", { error: String(err) })
    );
  }

  return NextResponse.json(toJSON(member), { status: 201 });
}
