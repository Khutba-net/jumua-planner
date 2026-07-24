import { NextRequest, NextResponse } from "next/server";
import { db, toJSON } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();

  const user = db.prepare("SELECT id, name, email, account_type, avatar_url, bio, phone FROM users WHERE id = ?").get(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let settings = db.prepare("SELECT * FROM user_settings WHERE user_id = ?").get(userId);
  if (!settings) {
    db.prepare("INSERT INTO user_settings (user_id) VALUES (?)").run(userId);
    settings = db.prepare("SELECT * FROM user_settings WHERE user_id = ?").get(userId);
  }

  return NextResponse.json(toJSON({ user, settings }));
}

export async function PUT(req: NextRequest) {
  const userId = await getUserId();
  const body = await req.json();
  const { section } = body;

  if (section === "profile") {
    const { name, email, bio, phone } = body;
    db.prepare("UPDATE users SET name = ?, email = ?, bio = ?, phone = ?, updated_at = datetime('now') WHERE id = ?")
      .run(name || "", email || "", bio || null, phone || null, userId);
  }

  if (section === "sermon") {
    const { default_language, word_target } = body;
    db.prepare(`
      INSERT INTO user_settings (user_id, default_language, word_target, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        default_language = excluded.default_language,
        word_target = excluded.word_target,
        updated_at = excluded.updated_at
    `).run(userId, default_language || "ar-first", word_target || 2500);
  }

  if (section === "notifications") {
    const { friday_reminder, email_assigned, weekly_digest } = body;
    db.prepare(`
      INSERT INTO user_settings (user_id, friday_reminder, email_assigned, weekly_digest, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        friday_reminder = excluded.friday_reminder,
        email_assigned = excluded.email_assigned,
        weekly_digest = excluded.weekly_digest,
        updated_at = excluded.updated_at
    `).run(userId, friday_reminder || "3", email_assigned ? 1 : 0, weekly_digest ? 1 : 0);
  }

  if (section === "appearance") {
    const { theme_mode, editor_font_size } = body;
    db.prepare(`
      INSERT INTO user_settings (user_id, theme_mode, editor_font_size, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        theme_mode = excluded.theme_mode,
        editor_font_size = excluded.editor_font_size,
        updated_at = excluded.updated_at
    `).run(userId, theme_mode || "light", editor_font_size || 16);
  }

  return NextResponse.json({ success: true });
}
