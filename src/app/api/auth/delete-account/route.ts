import { NextResponse } from "next/server";
import { queryOne, exec, withTransaction } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE() {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }

  const user = await queryOne("SELECT id FROM users WHERE id = $1", [userId]);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await withTransaction(async (client) => {
    await client.query("DELETE FROM references_ WHERE sermon_id IN (SELECT id FROM sermons WHERE author_id = $1)", [userId]);
    await client.query("DELETE FROM feedback WHERE sermon_id IN (SELECT id FROM sermons WHERE author_id = $1)", [userId]);
    await client.query("UPDATE sermons SET sub_topic_id = NULL WHERE author_id = $1", [userId]);
    await client.query("DELETE FROM sermons WHERE author_id = $1", [userId]);
    await client.query("DELETE FROM sub_topics WHERE theme_id IN (SELECT id FROM themes WHERE owner_id = $1)", [userId]);
    await client.query("DELETE FROM themes WHERE owner_id = $1", [userId]);
    await client.query("DELETE FROM user_settings WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM users WHERE id = $1", [userId]);
  });

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
