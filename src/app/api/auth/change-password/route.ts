import { NextResponse } from "next/server";
import { queryOne, hashPassword, verifyPassword } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";
import { deleteAllUserSessions, createSession, sessionCookieOptions } from "@/lib/session";
import { rateLimitByIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimitByIp(ip, "change-password", 5, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || typeof currentPassword !== "string") {
    return NextResponse.json({ error: "Current password is required" }, { status: 400 });
  }
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
  }
  if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
    return NextResponse.json({ error: "Password must include uppercase, lowercase, number, and special character" }, { status: 400 });
  }

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
