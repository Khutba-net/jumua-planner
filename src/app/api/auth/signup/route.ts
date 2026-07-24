import { NextResponse } from "next/server";
import { db, cuid, toJSON } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const { name, email, password, account_type, org_name, city, country } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const userId = cuid();
  let organizationId: string | null = null;

  if (account_type !== "individual" && org_name) {
    organizationId = cuid();
    db.prepare(
      "INSERT INTO organizations (id, name, type, city, country) VALUES (?, ?, ?, ?, ?)"
    ).run(organizationId, org_name, account_type || "organization", city || null, country || null);
  }

  db.prepare(
    "INSERT INTO users (id, email, name, role, account_type, organization_id) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(userId, email, name, "khatib", account_type || "individual", organizationId);

  const user = db.prepare("SELECT id, email, name, account_type FROM users WHERE id = ?").get(userId);

  const res = NextResponse.json({ user: toJSON(user) });
  res.cookies.set("user_id", userId, { path: "/", httpOnly: true, maxAge: 60 * 60 * 24 * 30 });
  return res;
}
