import { NextResponse } from "next/server";
import { db, cuid, toJSON, hashPassword } from "@/lib/db";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { code } = await params;

  const member = db.prepare(
    "SELECT m.id, m.name, m.status, m.invite_expires_at, o.name as org_name FROM org_members m JOIN organizations o ON o.id = m.organization_id WHERE m.invite_code = ?"
  ).get(code) as { id: string; name: string; status: string; invite_expires_at: string; org_name: string } | undefined;

  if (!member) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
  }

  if (member.status !== "invited") {
    return NextResponse.json({ error: "This invite has already been used" }, { status: 410 });
  }

  if (member.invite_expires_at && new Date(member.invite_expires_at) < new Date()) {
    return NextResponse.json({ error: "This invite has expired" }, { status: 410 });
  }

  return NextResponse.json({
    khatib_name: member.name,
    org_name: member.org_name,
  });
}

export async function POST(req: Request, { params }: Params) {
  const { code } = await params;
  const body = await req.json();
  const { name, email, password } = body;

  if (!email || !password || !name) {
    return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
  }

  const member = db.prepare(
    "SELECT m.id, m.name, m.status, m.organization_id, m.invite_expires_at FROM org_members m WHERE m.invite_code = ?"
  ).get(code) as { id: string; name: string; status: string; organization_id: string; invite_expires_at: string } | undefined;

  if (!member) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
  }

  if (member.status !== "invited") {
    return NextResponse.json({ error: "This invite has already been used" }, { status: 410 });
  }

  if (member.invite_expires_at && new Date(member.invite_expires_at) < new Date()) {
    return NextResponse.json({ error: "This invite has expired" }, { status: 410 });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists. Log in and use the invite link." }, { status: 409 });
  }

  const userId = cuid();
  const passwordHash = hashPassword(password);

  const run = db.transaction(() => {
    db.prepare(
      "INSERT INTO users (id, email, name, password_hash, role, account_type, organization_id, onboarding_complete, planning_year) VALUES (?, ?, ?, ?, 'khatib', 'organization', ?, 0, ?)"
    ).run(userId, email, name, passwordHash, member.organization_id, new Date().getFullYear());

    db.prepare(
      "UPDATE org_members SET user_id = ?, status = 'active', email = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(userId, email, member.id);
  });

  run();

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
