import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/session";

export async function getUserId(): Promise<string> {
  const cookieStore = await cookies();

  const sessionToken = cookieStore.get("session")?.value;
  if (sessionToken) {
    const userId = verifySessionToken(sessionToken);
    if (userId) return userId;
  }

  throw new AuthError("Not authenticated");
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
