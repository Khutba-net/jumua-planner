import { NextResponse } from "next/server";
import { db, toJSON, verifyPassword } from "@/lib/db";
import { rateLimitByIp } from "@/lib/rate-limit";
import { loginSchema, parseBody } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimitByIp(ip, "login", 5, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many login attempts. Try again in a minute." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = parseBody(loginSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = db.prepare(
    "SELECT id, email, name, password_hash, account_type, onboarding_complete FROM users WHERE email = ?"
  ).get(email) as { id: string; password_hash: string | null } | undefined;

  if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const { password_hash: _, ...safeUser } = user as Record<string, unknown>;
  const res = NextResponse.json({ user: toJSON(safeUser) });
  res.cookies.set("user_id", user.id, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
