import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

export async function getUserId(): Promise<string> {
  const cookieStore = await cookies();

  const token = cookieStore.get("session")?.value;
  if (token) {
    const userId = await verifySession(token);
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
