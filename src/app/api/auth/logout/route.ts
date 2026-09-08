import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession } from "@/lib/session";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (token) {
    await deleteSession(token);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", "", { path: "/", maxAge: 0 });
  res.cookies.set("user_id", "", { path: "/", maxAge: 0 });
  return res;
}
