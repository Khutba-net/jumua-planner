import { NextResponse } from "next/server";
import { getUserId, AuthError } from "@/lib/auth";
import { exec } from "@/lib/db";
import { getNotifications, getUnreadCount } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const userId = await getUserId({ skipSubscriptionCheck: true });
    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit") || 20), 50);
    const offset = Number(url.searchParams.get("offset") || 0);

    const [notifications, unreadCount] = await Promise.all([
      getNotifications(userId, limit, offset),
      getUnreadCount(userId),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: (e as AuthError).status });
    throw e;
  }
}

export async function PATCH() {
  try {
    const userId = await getUserId({ skipSubscriptionCheck: true });
    await exec(
      "UPDATE notifications SET read = 1 WHERE user_id = $1 AND read = 0",
      [userId]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: (e as AuthError).status });
    throw e;
  }
}
