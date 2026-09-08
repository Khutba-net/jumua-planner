import { NextResponse } from "next/server";
import { query, queryOne, cuid, toJSON, hashPassword } from "@/lib/db";
import { rateLimitByIp } from "@/lib/rate-limit";
import { signupSchema, parseBody } from "@/lib/validations";
import { createSession, sessionCookieOptions } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimitByIp(ip, "signup", 3, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many signup attempts. Try again in a minute." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = parseBody(signupSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { name, email, password } = parsed.data;

  const existing = await queryOne("SELECT id FROM users WHERE email = $1", [email]);
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const userId = cuid();
  const passwordHash = hashPassword(password);

  await query(
    "INSERT INTO users (id, email, name, password_hash, role, onboarding_complete) VALUES ($1, $2, $3, $4, $5, $6)",
    [userId, email, name, passwordHash, "khatib", 0]
  );

  const user = await queryOne("SELECT id, email, name, onboarding_complete FROM users WHERE id = $1", [userId]);

  const res = NextResponse.json({ user: toJSON(user) });
  const token = await createSession(userId);
  res.cookies.set("session", token, sessionCookieOptions());
  return res;
}
