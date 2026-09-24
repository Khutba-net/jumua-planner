import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { queryOne, exec, hashPassword } from "@/lib/db";
import { deleteAllUserSessions } from "@/lib/session";
import { rateLimitByIpAsync } from "@/lib/rate-limit";
import { resetPasswordSchema, parseBody } from "@/lib/validations";
import { sendPasswordChanged } from "@/lib/email";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIpAsync(ip, "reset-password", 5, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = parseBody(resetPasswordSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { token, password } = parsed.data;

  const hashedToken = createHash("sha256").update(token).digest("hex");
  const resetToken = await queryOne<{ id: string; user_id: string; expires_at: string; used: number }>(
    "SELECT id, user_id, expires_at, used FROM password_reset_tokens WHERE token = $1",
    [hashedToken]
  );

  if (!resetToken) {
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
  }

  if (resetToken.used) {
    return NextResponse.json({ error: "This reset link has already been used" }, { status: 400 });
  }

  if (new Date(resetToken.expires_at) < new Date()) {
    return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });
  }

  const newHash = hashPassword(password);

  await exec("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [newHash, resetToken.user_id]);
  await exec("UPDATE password_reset_tokens SET used = 1 WHERE id = $1", [resetToken.id]);

  await deleteAllUserSessions(resetToken.user_id);

  const user = await queryOne<{ email: string; name: string }>(
    "SELECT email, name FROM users WHERE id = $1", [resetToken.user_id]
  );
  if (user && process.env.RESEND_API_KEY) {
    await sendPasswordChanged(user.email, user.name).catch((err) =>
      logger.error("Failed to send password changed email", { error: String(err) })
    );
  }

  return NextResponse.json({ ok: true, message: "Password has been reset. You can now sign in." });
}
