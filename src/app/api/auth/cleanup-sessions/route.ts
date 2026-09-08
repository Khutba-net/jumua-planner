import { NextResponse } from "next/server";
import { exec } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await exec("DELETE FROM sessions WHERE expires_at < NOW()");
  const deletedTokens = await exec("DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used = 1");

  return NextResponse.json({
    ok: true,
    sessions_deleted: deleted,
    reset_tokens_deleted: deletedTokens,
    cleaned_at: new Date().toISOString(),
  });
}
