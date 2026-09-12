import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { query, queryOne, exec, cuid, toJSON, hashPassword } from "@/lib/db";
import { rateLimitByIpAsync } from "@/lib/rate-limit";
import { signupSchema, parseBody } from "@/lib/validations";
import { createSession, sessionCookieOptions } from "@/lib/session";
import { sendEmailVerification } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIpAsync(ip, "signup", 3, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many signup attempts. Try again in a minute." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = parseBody(signupSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { name, password } = parsed.data;
  const email = parsed.data.email.toLowerCase().trim();

  const existing = await queryOne("SELECT id FROM users WHERE LOWER(email) = $1", [email]);
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const userId = cuid();
  const passwordHash = hashPassword(password);

  await query(
    "INSERT INTO users (id, email, name, password_hash, role, onboarding_complete) VALUES ($1, $2, $3, $4, $5, $6)",
    [userId, email, name, passwordHash, "khatib", 0]
  );

  const user = await queryOne("SELECT id, email, name, onboarding_complete, email_verified FROM users WHERE id = $1", [userId]);

  const verificationCode = randomBytes(3).toString("hex").toUpperCase().slice(0, 6);
  const tokenId = cuid();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await exec(
    "INSERT INTO email_verification_tokens (id, user_id, code, expires_at) VALUES ($1, $2, $3, $4)",
    [tokenId, userId, verificationCode, expiresAt.toISOString()]
  );

  if (process.env.RESEND_API_KEY) {
    await sendEmailVerification(email, name, verificationCode).catch((err) =>
      logger.error("Failed to send verification email", { error: String(err) })
    );
  } else {
    logger.info("Verification code generated", { email, code: verificationCode });
  }

  const res = NextResponse.json({ user: toJSON(user) });
  const token = await createSession(userId);
  res.cookies.set("session", token, sessionCookieOptions());
  return res;
}
