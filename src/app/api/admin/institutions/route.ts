import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/admin";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePlatformAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const institutions = await query<{
      id: string;
      name: string;
      type: string;
      city: string | null;
      country: string | null;
      max_mosques: number | null;
      max_khatibs: number | null;
      custom_price_cents: number | null;
      billing_notes: string | null;
      billing_status: string;
      stripe_customer_id: string | null;
      created_at: string;
      mosque_count: number;
      member_count: number;
    }>(
      `SELECT o.*,
        (SELECT COUNT(*) FROM mosques m WHERE m.organization_id = o.id)::int AS mosque_count,
        (SELECT COUNT(*) FROM org_members om WHERE om.organization_id = o.id)::int AS member_count
      FROM organizations o
      WHERE o.type = 'institution'
      ORDER BY o.created_at DESC`
    );

    return NextResponse.json({ institutions });
  } catch (e) {
    logger.error("Admin: failed to list institutions", { error: String(e) });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
