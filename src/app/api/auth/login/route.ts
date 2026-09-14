import { NextResponse } from "next/server";
import { query, queryOne, exec, toJSON, verifyPassword, withTransaction } from "@/lib/db";
import { rateLimitByIpAsync } from "@/lib/rate-limit";
import { loginSchema, parseBody } from "@/lib/validations";
import { createSession, sessionCookieOptions } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIpAsync(ip, "login", 5, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many login attempts. Try again in a minute." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = parseBody(loginSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { password } = parsed.data;
  const email = parsed.data.email.toLowerCase().trim();

  const user = await queryOne<{ id: string; password_hash: string | null }>(
    "SELECT id, email, name, password_hash, account_type, onboarding_complete FROM users WHERE LOWER(email) = $1",
    [email]
  );

  if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // Block login only if user has org memberships and ALL are deactivated
  const activeMembership = await queryOne(
    "SELECT id FROM org_members WHERE user_id = $1 AND status != 'deactivated' LIMIT 1",
    [user.id]
  );
  const anyMembership = await queryOne(
    "SELECT id FROM org_members WHERE user_id = $1 LIMIT 1",
    [user.id]
  );
  if (anyMembership && !activeMembership) {
    return NextResponse.json({ error: "Your account has been deactivated. Contact your organization admin." }, { status: 403 });
  }

  const { invite_code, mosque_invite_code } = parsed.data as { invite_code?: string; mosque_invite_code?: string };
  if (invite_code) {
    const member = await queryOne<{ id: string; organization_id: string; status: string; invite_expires_at: string | null }>(
      "SELECT id, organization_id, status, invite_expires_at FROM org_members WHERE invite_code = $1 AND status = 'invited'",
      [invite_code]
    );

    if (member && (!member.invite_expires_at || new Date(member.invite_expires_at) >= new Date())) {
      await withTransaction(async (client) => {
        await client.query(
          "UPDATE org_members SET user_id = $1, email = $2, status = 'active', updated_at = NOW() WHERE id = $3",
          [user.id, email, member.id]
        );
        await client.query(
          "UPDATE users SET organization_id = $1, account_type = 'organization', role = 'khatib', updated_at = NOW() WHERE id = $2",
          [member.organization_id, user.id]
        );
      });
    }
  }

  if (mosque_invite_code) {
    const mosque = await queryOne<{ id: string; organization_id: string; invite_status: string; invite_expires_at: string | null; name: string }>(
      "SELECT id, organization_id, invite_status, invite_expires_at, name FROM mosques WHERE invite_code = $1 AND invite_status = 'invited'",
      [mosque_invite_code]
    );

    if (mosque && (!mosque.invite_expires_at || new Date(mosque.invite_expires_at) >= new Date())) {
      const { cuid } = await import("@/lib/db");
      const userName = (user as Record<string, unknown>).name as string || email;
      await withTransaction(async (client) => {
        await client.query(
          "UPDATE mosques SET admin_user_id = $1, admin_email = $2, invite_status = 'accepted', updated_at = NOW() WHERE id = $3",
          [user.id, email, mosque.id]
        );
        const memberId = cuid();
        await client.query(
          `INSERT INTO org_members (id, organization_id, mosque_id, user_id, name, email, role, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'mosque_admin', 'active')
           ON CONFLICT DO NOTHING`,
          [memberId, mosque.organization_id, mosque.id, user.id, userName, email]
        );
        await client.query(
          "UPDATE users SET organization_id = $1, account_type = 'institution', role = 'mosque_admin', updated_at = NOW() WHERE id = $2",
          [mosque.organization_id, user.id]
        );
      });
    }
  }

  const freshUser = await queryOne(
    "SELECT id, email, name, account_type, onboarding_complete FROM users WHERE id = $1",
    [user.id]
  );

  const token = await createSession(user.id);
  const res = NextResponse.json({ user: toJSON(freshUser) });
  res.cookies.set("session", token, sessionCookieOptions());
  res.cookies.delete("user_id");
  return res;
}
