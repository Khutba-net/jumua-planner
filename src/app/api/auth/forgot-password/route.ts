import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { queryOne, exec, cuid } from "@/lib/db";
import { rateLimitByIpAsync } from "@/lib/rate-limit";
import { sendPasswordReset } from "@/lib/email";
import { forgotPasswordSchema, parseBody } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIpAsync(ip, "forgot-password", 3, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = parseBody(forgotPasswordSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { email } = parsed.data;

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

  const hashedToken = createHash("sha256").update(token).digest("hex");
  await exec(
    "INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)",
    [id, user.id, hashedToken, expiresAt.toISOString()]
  );

  // In production, send email with reset link. For now, log it and return the token in dev.
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3100"}/auth/reset-password?token=${token}`;

  if (process.env.RESEND_API_KEY) {
    await sendPasswordReset(email, user.name, resetUrl).catch((err) =>
      logger.error("Failed to send password reset email", { error: String(err) })
    );
  } else {
    logger.info("Password reset link generated", { email });
  }

  return NextResponse.json({ ok: true, message: "If an account with that email exists, a reset link has been generated." });
}
