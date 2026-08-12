import { NextResponse } from "next/server";
import { db, cuid, toJSON } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getUserId();
  const user = db.prepare("SELECT id, name, account_type, onboarding_complete, planning_year FROM users WHERE id = ?").get(userId);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  return NextResponse.json(toJSON(user));
}

export async function POST(req: Request) {
  const userId = await getUserId();
  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { account_type, org_name, city, country, planning_year } = body;

  if (!account_type) {
    return NextResponse.json({ error: "Account type is required" }, { status: 400 });
  }

  let organizationId: string | null = null;

  if (account_type !== "individual" && org_name) {
    organizationId = cuid();
    db.prepare(
      "INSERT INTO organizations (id, name, type, city, country) VALUES (?, ?, ?, ?, ?)"
    ).run(organizationId, org_name, account_type, city || null, country || null);
  }

  db.prepare(
    "UPDATE users SET account_type = ?, organization_id = ?, onboarding_complete = 1, planning_year = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(account_type, organizationId, planning_year || new Date().getFullYear(), userId);

  const updated = db.prepare("SELECT id, email, name, account_type, onboarding_complete, planning_year FROM users WHERE id = ?").get(userId);
  return NextResponse.json(toJSON(updated));
}
