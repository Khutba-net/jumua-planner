import { NextResponse } from "next/server";
import { db, cuid, toJSON, hashPassword } from "@/lib/db";
import { rateLimitByIp } from "@/lib/rate-limit";
import { signupSchema, parseBody } from "@/lib/validations";

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

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const userId = cuid();
  const passwordHash = hashPassword(password);

  db.prepare(
    "INSERT INTO users (id, email, name, password_hash, role, onboarding_complete) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(userId, email, name, passwordHash, "khatib", 0);

  const user = db.prepare("SELECT id, email, name, onboarding_complete FROM users WHERE id = ?").get(userId);

  const res = NextResponse.json({ user: toJSON(user) });
  res.cookies.set("user_id", userId, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
