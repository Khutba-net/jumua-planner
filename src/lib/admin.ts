import { getUserId } from "@/lib/auth";
import { queryOne } from "@/lib/db";

export async function requirePlatformAdmin(): Promise<string> {
  const userId = await getUserId();
  const user = await queryOne<{ is_platform_admin: number }>(
    "SELECT is_platform_admin FROM users WHERE id = $1",
    [userId]
  );
  if (!user || !user.is_platform_admin) {
    throw new Error("FORBIDDEN");
  }
  return userId;
}
