import { NextResponse } from "next/server";
import { query, queryOne, exec, toJSON, verifyPassword, withTransaction } from "@/lib/db";
import { rateLimitByIp } from "@/lib/rate-limit";
import { loginSchema, parseBody } from "@/lib/validations";
import { createSession, sessionCookieOptions } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimitByIp(ip, "login", 5, 60_000);
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

  const { invite_code } = parsed.data as { invite_code?: string };
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
