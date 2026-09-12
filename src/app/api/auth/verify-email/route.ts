import { NextResponse } from "next/server";
import { queryOne, exec } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";
import { rateLimitByIpAsync } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIpAsync(ip, "verify-email", 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }

  const { code } = await req.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Verification code is required" }, { status: 400 });
  }

  const token = await queryOne<{ id: string; expires_at: string }>(
    "SELECT id, expires_at FROM email_verification_tokens WHERE user_id = $1 AND code = $2 AND used = 0 ORDER BY created_at DESC LIMIT 1",
    [userId, code.trim().toUpperCase()]
  );

  if (!token) {
    return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
  }

  if (new Date(token.expires_at) < new Date()) {
    return NextResponse.json({ error: "Verification code has expired" }, { status: 400 });
  }

  await exec("UPDATE email_verification_tokens SET used = 1 WHERE id = $1", [token.id]);
  await exec("UPDATE users SET email_verified = 1 WHERE id = $1", [userId]);

  return NextResponse.json({ ok: true });
}
