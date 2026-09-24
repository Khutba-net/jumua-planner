import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { query, queryOne, cuid, toJSON, withTransaction } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";
import { sendInvitation, sendMosqueInvitation } from "@/lib/email";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  let userId: string;
  try { userId = await getUserId({ skipSubscriptionCheck: true }); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: (e as AuthError).status });
    throw e;
  }
  const user = await queryOne("SELECT id, name, account_type, role, organization_id, onboarding_complete, planning_year FROM users WHERE id = $1", [userId]);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(toJSON(user));
}

export async function POST(req: Request) {
  let userId: string;
  try { userId = await getUserId({ skipSubscriptionCheck: true }); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: (e as AuthError).status });
    throw e;
  }
  const user = await queryOne<{ id: string; name: string; organization_id: string | null; role: string }>(
    "SELECT id, name, organization_id, role FROM users WHERE id = $1", [userId]
  );
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const { account_type, org_name, city, country, planning_year, khatib_entries, mosque_entries } = body;

  if (user.organization_id && (user.role === "khatib" || user.role === "mosque_admin")) {
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

        if (account_type === "institution") {
          const entries: { name: string; city?: string; email?: string }[] = Array.isArray(mosque_entries) ? mosque_entries : [];
          const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3100";
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

          for (const entry of entries) {
            const trimmedName = entry.name?.trim();
            if (!trimmedName) continue;
            const adminEmail = entry.email?.trim()?.toLowerCase() || null;
            const inviteCode = adminEmail ? randomBytes(4).toString("hex") : null;

            await client.query(
              `INSERT INTO mosques (id, name, city, organization_id, admin_email, invite_code, invite_expires_at, invite_status)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                cuid(),
                trimmedName.slice(0, 200),
                entry.city?.trim()?.slice(0, 100) || null,
                organizationId,
                adminEmail,
                inviteCode,
                adminEmail ? expiresAt : null,
                adminEmail ? "invited" : "pending",
              ]
            );

            if (adminEmail && inviteCode && process.env.RESEND_API_KEY) {
              const inviteUrl = `${APP_URL}/mosque-invite/${inviteCode}`;
              sendMosqueInvitation(
                adminEmail,
                user.name,
                trimmedName,
                org_name,
                inviteUrl
              ).catch((err) => logger.error("Failed to send mosque invitation email", { error: String(err) }));
            }
          }
        } else {
          const entries: { name: string; email?: string }[] = Array.isArray(khatib_entries) ? khatib_entries : [];
          const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3100";
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

          for (const entry of entries) {
            const trimmedName = entry.name?.trim();
            if (!trimmedName) continue;
            const khatibEmail = entry.email?.trim()?.toLowerCase() || null;
            const inviteCode = randomBytes(4).toString("hex");

            await client.query(
              "INSERT INTO org_members (id, organization_id, name, email, role, status, invite_code, invite_expires_at) VALUES ($1, $2, $3, $4, 'khatib', 'invited', $5, $6)",
              [cuid(), organizationId, trimmedName, khatibEmail, inviteCode, expiresAt]
            );

            if (khatibEmail && process.env.RESEND_API_KEY) {
              const inviteUrl = `${APP_URL}/invite/${inviteCode}`;
              sendInvitation(
                khatibEmail,
                user.name,
                org_name,
                inviteUrl
              ).catch((err) => logger.error("Failed to send khatib invitation email", { error: String(err) }));
            }
          }
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
