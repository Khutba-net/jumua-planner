import { NextResponse } from "next/server";
import { exec } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();

  const sessions = await exec(
    "DELETE FROM sessions WHERE expires_at < $1", [now]
  );

  const resetTokens = await exec(
    "DELETE FROM password_reset_tokens WHERE expires_at < $1 OR used = 1", [now]
  );

  const verifyTokens = await exec(
    "DELETE FROM email_verification_tokens WHERE expires_at < $1 OR used = 1", [now]
  );

  logger.info("Cleanup complete", {
    expiredSessions: sessions,
    expiredResetTokens: resetTokens,
    expiredVerifyTokens: verifyTokens,
  });

  return NextResponse.json({
    ok: true,
    cleaned: {
      sessions,
      resetTokens,
      verifyTokens,
    },
  });
}
