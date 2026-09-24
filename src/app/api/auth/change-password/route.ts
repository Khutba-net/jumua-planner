import { NextResponse } from "next/server";
import { queryOne, hashPassword, verifyPassword } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";
import { deleteAllUserSessions, createSession, sessionCookieOptions } from "@/lib/session";
import { rateLimitByIpAsync } from "@/lib/rate-limit";
import { changePasswordSchema, parseBody } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIpAsync(ip, "change-password", 5, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  let userId: string;
  try { userId = await getUserId({ skipSubscriptionCheck: true }); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: (e as AuthError).status });
    throw e;
  }

  const body = await req.json();
  const parsed = parseBody(changePasswordSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { currentPassword, newPassword } = parsed.data;

  const user = await queryOne<{ password_hash: string | null }>(
    "SELECT password_hash FROM users WHERE id = $1", [userId]
  );
  if (!user?.password_hash || !verifyPassword(currentPassword, user.password_hash)) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  const newHash = hashPassword(newPassword);
  await queryOne("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id", [newHash, userId]);

  await deleteAllUserSessions(userId);
  const token = await createSession(userId);

  const res = NextResponse.json({ ok: true, message: "Password updated successfully" });
  res.cookies.set("session", token, sessionCookieOptions());
  return res;
}
