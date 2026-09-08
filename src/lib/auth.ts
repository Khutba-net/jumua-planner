import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/session";

export async function getUserId(): Promise<string> {
  const cookieStore = await cookies();

  const sessionToken = cookieStore.get("session")?.value;
  if (sessionToken) {
    const userId = verifySessionToken(sessionToken);
    if (userId) return userId;
  }

  // Legacy fallback — remove after all users have re-logged
  const legacyId = cookieStore.get("user_id")?.value;
  if (legacyId) return legacyId;

  throw new AuthError("Not authenticated");
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
