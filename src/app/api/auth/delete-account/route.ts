import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE() {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }

  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const txn = db.transaction(() => {
    db.prepare("DELETE FROM references_ WHERE sermon_id IN (SELECT id FROM sermons WHERE author_id = ?)").run(userId);
    db.prepare("DELETE FROM feedback WHERE sermon_id IN (SELECT id FROM sermons WHERE author_id = ?)").run(userId);
    db.prepare("UPDATE sermons SET sub_topic_id = NULL WHERE author_id = ?").run(userId);
    db.prepare("DELETE FROM sermons WHERE author_id = ?").run(userId);
    db.prepare("DELETE FROM sub_topics WHERE theme_id IN (SELECT id FROM themes WHERE owner_id = ?)").run(userId);
    db.prepare("DELETE FROM themes WHERE owner_id = ?").run(userId);
    db.prepare("DELETE FROM user_settings WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM users WHERE id = ?").run(userId);
  });

  txn();

  const res = NextResponse.json({ ok: true });
  res.cookies.set("user_id", "", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
  });
  return res;
}
