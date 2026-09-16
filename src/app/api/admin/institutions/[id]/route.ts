import { NextRequest, NextResponse } from "next/server";
import { queryOne, exec } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/admin";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePlatformAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const org = await queryOne<Record<string, unknown>>(
    `SELECT o.*,
      (SELECT COUNT(*) FROM mosques m WHERE m.organization_id = o.id)::int AS mosque_count,
      (SELECT COUNT(*) FROM org_members om WHERE om.organization_id = o.id)::int AS member_count
    FROM organizations o WHERE o.id = $1`,
    [id]
  );

  if (!org) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const mosques = await import("@/lib/db").then((db) =>
    db.query<{ id: string; name: string; city: string | null; capacity: number | null }>(
      "SELECT id, name, city, capacity FROM mosques WHERE organization_id = $1 ORDER BY name",
      [id]
    )
  );

  const members = await import("@/lib/db").then((db) =>
    db.query<{ id: string; user_id: string; role: string; name: string; email: string }>(
      `SELECT om.id, om.user_id, om.role, u.name, u.email
       FROM org_members om JOIN users u ON u.id = om.user_id
       WHERE om.organization_id = $1 ORDER BY om.role, u.name`,
      [id]
    )
  );

  return NextResponse.json({ institution: org, mosques, members });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePlatformAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { max_mosques, max_khatibs, custom_price_cents, billing_notes, billing_status } = body;

  const org = await queryOne<{ id: string }>(
    "SELECT id FROM organizations WHERE id = $1",
    [id]
  );
  if (!org) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await exec(
    `UPDATE organizations SET
      max_mosques = COALESCE($1, max_mosques),
      max_khatibs = COALESCE($2, max_khatibs),
      custom_price_cents = COALESCE($3, custom_price_cents),
      billing_notes = COALESCE($4, billing_notes),
      billing_status = COALESCE($5, billing_status),
      updated_at = NOW()
    WHERE id = $6`,
    [
      max_mosques ?? null,
      max_khatibs ?? null,
      custom_price_cents ?? null,
      billing_notes ?? null,
      billing_status ?? null,
      id,
    ]
  );

  logger.info("Admin: updated institution", { id, ...body });

  return NextResponse.json({ ok: true });
}
