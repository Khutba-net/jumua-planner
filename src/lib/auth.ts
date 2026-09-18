import { cookies } from "next/headers";
import { verifySession, deleteSession } from "@/lib/session";
import { queryOne } from "@/lib/db";

export async function getUserId(): Promise<string> {
  const cookieStore = await cookies();

  const token = cookieStore.get("session")?.value;
  if (token) {
    const userId = await verifySession(token);
    if (userId) {
      const deactivated = await queryOne(
        "SELECT id FROM org_members WHERE user_id = $1 AND status = 'deactivated'",
        [userId]
      );
      if (deactivated) {
        await deleteSession(token);
        throw new AuthError("Account deactivated");
      }
      return userId;
    }
  }

  throw new AuthError("Not authenticated");
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
