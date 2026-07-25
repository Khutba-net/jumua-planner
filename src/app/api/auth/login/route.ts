import { NextResponse } from "next/server";
import { db, toJSON } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const { email } = body;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const user = db.prepare("SELECT id, email, name, account_type FROM users WHERE email = ?").get(email);
  if (!user) {
    return NextResponse.json({ error: "No account found with this email" }, { status: 401 });
  }

  const u = user as { id: string };
  const res = NextResponse.json({ user: toJSON(user) });
  res.cookies.set("user_id", u.id, { path: "/", httpOnly: true, maxAge: 60 * 60 * 24 * 30 });
  return res;
}
