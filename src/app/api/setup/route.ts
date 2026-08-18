import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db, cuid, toJSON } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getUserId();
  const user = db.prepare("SELECT id, name, account_type, role, organization_id, onboarding_complete, planning_year FROM users WHERE id = ?").get(userId);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  return NextResponse.json(toJSON(user));
}

export async function POST(req: Request) {
  const userId = await getUserId();
  const user = db.prepare("SELECT id, name, organization_id, role FROM users WHERE id = ?").get(userId) as { id: string; name: string; organization_id: string | null; role: string } | undefined;
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { account_type, org_name, city, country, planning_year, khatib_names } = body;

  if (user.organization_id && user.role === "khatib") {
    db.prepare(
      "UPDATE users SET onboarding_complete = 1, planning_year = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(planning_year || new Date().getFullYear(), userId);
  } else {
    if (!account_type) {
      return NextResponse.json({ error: "Account type is required" }, { status: 400 });
    }

    const run = db.transaction(() => {
      let organizationId: string | null = null;

      if (account_type !== "individual" && org_name) {
        organizationId = cuid();
        db.prepare(
          "INSERT INTO organizations (id, name, type, city, country) VALUES (?, ?, ?, ?, ?)"
        ).run(organizationId, org_name, account_type, city || null, country || null);

        db.prepare(
          "INSERT INTO org_members (id, organization_id, user_id, name, role, status) VALUES (?, ?, ?, ?, 'admin', 'active')"
        ).run(cuid(), organizationId, userId, user.name);

        const names: string[] = Array.isArray(khatib_names) ? khatib_names : [];
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        for (const kn of names) {
          const trimmed = kn.trim();
          if (!trimmed) continue;
          const inviteCode = randomBytes(4).toString("hex");
          db.prepare(
            "INSERT INTO org_members (id, organization_id, name, role, status, invite_code, invite_expires_at) VALUES (?, ?, ?, 'khatib', 'invited', ?, ?)"
          ).run(cuid(), organizationId, trimmed, inviteCode, expiresAt);
        }
      }

      db.prepare(
        "UPDATE users SET account_type = ?, role = ?, organization_id = ?, onboarding_complete = 1, planning_year = ?, updated_at = datetime('now') WHERE id = ?"
      ).run(account_type, account_type !== "individual" ? "admin" : "khatib", organizationId, planning_year || new Date().getFullYear(), userId);
    });

    run();
  }

  const updated = db.prepare("SELECT id, email, name, account_type, role, onboarding_complete, planning_year FROM users WHERE id = ?").get(userId);
  return NextResponse.json(toJSON(updated));
}
