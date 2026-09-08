import { randomBytes } from "crypto";
import { queryOne, exec, cuid } from "@/lib/db";

const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const id = cuid();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE);

  await exec(
    "INSERT INTO sessions (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)",
    [id, userId, token, expiresAt.toISOString()]
  );

  return token;
}

export async function verifySession(token: string): Promise<string | null> {
  if (!token || typeof token !== "string" || token.length !== 64) return null;

  const session = await queryOne<{ user_id: string; expires_at: Date }>(
    "SELECT user_id, expires_at FROM sessions WHERE token = $1",
    [token]
  );

  if (!session) return null;

  if (new Date(session.expires_at) < new Date()) {
    await exec("DELETE FROM sessions WHERE token = $1", [token]);
    return null;
  }

  return session.user_id;
}

export async function deleteSession(token: string): Promise<void> {
  if (!token) return;
  await exec("DELETE FROM sessions WHERE token = $1", [token]);
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  await exec("DELETE FROM sessions WHERE user_id = $1", [userId]);
}

export function sessionCookieOptions() {
  return {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 30,
  };
}
