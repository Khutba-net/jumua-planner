import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || randomBytes(32).toString("hex");
const TOKEN_VERSION = "v1";

export function createSessionToken(userId: string): string {
  const timestamp = Date.now().toString(36);
  const nonce = randomBytes(8).toString("hex");
  const payload = `${TOKEN_VERSION}.${userId}.${timestamp}.${nonce}`;
  const sig = createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string): string | null {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 5) return null;

  const [version, userId, timestamp, nonce, sig] = parts;
  if (version !== TOKEN_VERSION || !userId || !timestamp || !nonce || !sig) return null;

  const payload = `${version}.${userId}.${timestamp}.${nonce}`;
  const expected = createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");

  const sigBuf = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

  const created = parseInt(timestamp, 36);
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
  if (Date.now() - created > maxAge) return null;

  return userId;
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
