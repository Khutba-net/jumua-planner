import { exec, cuid, queryOne, query } from "@/lib/db";
import { logger } from "@/lib/logger";

export type NotificationType =
  | "assignment"
  | "schedule_change"
  | "invite_accepted"
  | "member_removed"
  | "member_deactivated"
  | "member_reactivated"
  | "admin_transferred"
  | "khatib_left"
  | "mosque_detached"
  | "general";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string
): Promise<void> {
  const id = cuid();
  await exec(
    `INSERT INTO notifications (id, user_id, type, title, body, link) VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, userId, type, title, body, link || null]
  );

  try {
    const prefs = await queryOne<{ email_assigned: number; weekly_digest: number }>(
      "SELECT email_assigned, weekly_digest FROM user_settings WHERE user_id = $1",
      [userId]
    );

    const user = await queryOne<{ email: string; name: string }>(
      "SELECT email, name FROM users WHERE id = $1",
      [userId]
    );

    if (!user?.email || !process.env.RESEND_API_KEY) return;

    if ((type === "assignment" || type === "schedule_change") && prefs?.email_assigned) {
      const { sendAssignmentNotification } = await import("@/lib/email");
      await sendAssignmentNotification(user.email, user.name, title, "", body);
    }
  } catch (err) {
    logger.error("Failed to send notification email", { userId, type, error: String(err) });
  }
}

export async function createBulkNotifications(
  userIds: string[],
  type: NotificationType,
  title: string,
  body: string,
  link?: string
): Promise<void> {
  for (const userId of userIds) {
    await createNotification(userId, type, title, body, link);
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  const row = await queryOne<{ count: string }>(
    "SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = 0",
    [userId]
  );
  return Number(row?.count ?? 0);
}

export async function getNotifications(userId: string, limit = 20, offset = 0) {
  return query<{
    id: string;
    type: string;
    title: string;
    body: string;
    link: string | null;
    read: number;
    created_at: string;
  }>(
    `SELECT id, type, title, body, link, read, created_at
     FROM notifications WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
}
