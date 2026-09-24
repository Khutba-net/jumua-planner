import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { queryOne, exec, cuid } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";
import { rateLimitByIpAsync } from "@/lib/rate-limit";
import { sendEmailVerification } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIpAsync(ip, "resend-verification", 2, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  let userId: string;
  try { userId = await getUserId({ skipSubscriptionCheck: true }); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: (e as AuthError).status });
    throw e;
  }

  const user = await queryOne<{ email: string; name: string; email_verified: number }>(
    "SELECT email, name, email_verified FROM users WHERE id = $1", [userId]
  );
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.email_verified) return NextResponse.json({ ok: true, message: "Email already verified" });

  await exec("UPDATE email_verification_tokens SET used = 1 WHERE user_id = $1 AND used = 0", [userId]);

  const code = randomBytes(3).toString("hex").toUpperCase().slice(0, 6);
  const tokenId = cuid();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await exec(
    "INSERT INTO email_verification_tokens (id, user_id, code, expires_at) VALUES ($1, $2, $3, $4)",
    [tokenId, userId, code, expiresAt.toISOString()]
  );

  if (process.env.RESEND_API_KEY) {
    await sendEmailVerification(user.email, user.name, code).catch((err) =>
      logger.error("Failed to send verification email", { error: String(err) })
    );
  } else {
    logger.info("Verification code generated", { email: user.email, code });
  }

  return NextResponse.json({ ok: true });
}
