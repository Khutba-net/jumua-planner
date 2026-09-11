import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { queryOne, exec, cuid } from "@/lib/db";
import { rateLimitByIp } from "@/lib/rate-limit";
import { sendPasswordReset } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimitByIp(ip, "forgot-password", 3, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  const { email } = await req.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await queryOne<{ id: string; name: string }>(
    "SELECT id, name FROM users WHERE LOWER(email) = $1", [email.toLowerCase().trim()]
  );

  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({ ok: true, message: "If an account with that email exists, a reset link has been generated." });
  }

  // Invalidate any existing tokens for this user
  await exec("UPDATE password_reset_tokens SET used = 1 WHERE user_id = $1 AND used = 0", [user.id]);

  const token = randomBytes(32).toString("hex");
  const id = cuid();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await exec(
    "INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)",
    [id, user.id, token, expiresAt.toISOString()]
  );

  // In production, send email with reset link. For now, log it and return the token in dev.
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3100"}/auth/reset-password?token=${token}`;

  if (process.env.RESEND_API_KEY) {
    await sendPasswordReset(email, user.name, resetUrl).catch((err) =>
      console.error("Failed to send password reset email:", err)
    );
  } else {
    console.log(`[DEV] Password reset link for ${email}: ${resetUrl}`);
  }

  return NextResponse.json({ ok: true, message: "If an account with that email exists, a reset link has been generated." });
}
