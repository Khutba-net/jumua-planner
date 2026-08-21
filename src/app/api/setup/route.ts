import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { query, queryOne, cuid, toJSON, withTransaction } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getUserId();
  const user = await queryOne("SELECT id, name, account_type, role, organization_id, onboarding_complete, planning_year FROM users WHERE id = $1", [userId]);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  return NextResponse.json(toJSON(user));
}

export async function POST(req: Request) {
  const userId = await getUserId();
  const user = await queryOne<{ id: string; name: string; organization_id: string | null; role: string }>(
    "SELECT id, name, organization_id, role FROM users WHERE id = $1", [userId]
  );
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { account_type, org_name, city, country, planning_year, khatib_names } = body;

  if (user.organization_id && user.role === "khatib") {
    await query(
      "UPDATE users SET onboarding_complete = 1, planning_year = $1, updated_at = NOW() WHERE id = $2",
      [planning_year || new Date().getFullYear(), userId]
    );
  } else {
    if (!account_type) {
      return NextResponse.json({ error: "Account type is required" }, { status: 400 });
    }

    await withTransaction(async (client) => {
      let organizationId: string | null = null;

      if (account_type !== "individual" && org_name) {
        organizationId = cuid();
        await client.query(
          "INSERT INTO organizations (id, name, type, city, country) VALUES ($1, $2, $3, $4, $5)",
          [organizationId, org_name, account_type, city || null, country || null]
        );

        await client.query(
          "INSERT INTO org_members (id, organization_id, user_id, name, role, status) VALUES ($1, $2, $3, $4, 'admin', 'active')",
          [cuid(), organizationId, userId, user.name]
        );

        const names: string[] = Array.isArray(khatib_names) ? khatib_names : [];
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        for (const kn of names) {
          const trimmed = kn.trim();
          if (!trimmed) continue;
          const inviteCode = randomBytes(4).toString("hex");
          await client.query(
            "INSERT INTO org_members (id, organization_id, name, role, status, invite_code, invite_expires_at) VALUES ($1, $2, $3, 'khatib', 'invited', $4, $5)",
            [cuid(), organizationId, trimmed, inviteCode, expiresAt]
          );
        }
      }

      await client.query(
        "UPDATE users SET account_type = $1, role = $2, organization_id = $3, onboarding_complete = 1, planning_year = $4, updated_at = NOW() WHERE id = $5",
        [account_type, account_type !== "individual" ? "admin" : "khatib", organizationId, planning_year || new Date().getFullYear(), userId]
      );
    });
  }

  const updated = await queryOne("SELECT id, email, name, account_type, role, onboarding_complete, planning_year FROM users WHERE id = $1", [userId]);
  return NextResponse.json(toJSON(updated));
}
