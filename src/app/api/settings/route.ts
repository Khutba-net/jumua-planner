import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, exec, cuid, toJSON } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";
import { settingsUpdateSchema, parseBody } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }

  const user = await queryOne("SELECT id, name, email, account_type, avatar_url, bio, phone FROM users WHERE id = $1", [userId]);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let settings = await queryOne("SELECT * FROM user_settings WHERE user_id = $1", [userId]);
  if (!settings) {
    await query("INSERT INTO user_settings (user_id) VALUES ($1)", [userId]);
    settings = await queryOne("SELECT * FROM user_settings WHERE user_id = $1", [userId]);
  }

  return NextResponse.json(toJSON({ user, settings }));
}

export async function PUT(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }
  const body = await req.json();
  const parsed = parseBody(settingsUpdateSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { section } = parsed.data;

  const d = parsed.data;

  if (section === "profile" && "name" in d) {
    await exec("UPDATE users SET name = $1, email = $2, bio = $3, phone = $4, updated_at = NOW() WHERE id = $5",
      [d.name || "", d.email || "", d.bio || null, d.phone || null, userId]);
  }

  if (section === "sermon" && "default_language" in d) {
    await query(`
      INSERT INTO user_settings (user_id, default_language, word_target, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT(user_id) DO UPDATE SET
        default_language = EXCLUDED.default_language,
        word_target = EXCLUDED.word_target,
        updated_at = EXCLUDED.updated_at
    `, [userId, d.default_language || "ar-first", d.word_target || 2500]);
  }

  if (section === "notifications" && "friday_reminder" in d) {
    await query(`
      INSERT INTO user_settings (user_id, friday_reminder, email_assigned, weekly_digest, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT(user_id) DO UPDATE SET
        friday_reminder = EXCLUDED.friday_reminder,
        email_assigned = EXCLUDED.email_assigned,
        weekly_digest = EXCLUDED.weekly_digest,
        updated_at = EXCLUDED.updated_at
    `, [userId, d.friday_reminder || "3", d.email_assigned ? 1 : 0, d.weekly_digest ? 1 : 0]);
  }

  if (section === "appearance" && "theme_mode" in d) {
    await query(`
      INSERT INTO user_settings (user_id, theme_mode, editor_font_size, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT(user_id) DO UPDATE SET
        theme_mode = EXCLUDED.theme_mode,
        editor_font_size = EXCLUDED.editor_font_size,
        updated_at = EXCLUDED.updated_at
    `, [userId, d.theme_mode || "light", d.editor_font_size || 16]);
  }

  if (section === "account_type" && "account_type" in d) {
    const newType = d.account_type;
    const user = await queryOne<{ organization_id: string | null; account_type: string }>(
      "SELECT organization_id, account_type FROM users WHERE id = $1", [userId]
    );
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    let orgId = user.organization_id;

    if (newType !== "individual" && !orgId) {
      if (!d.org_name) return NextResponse.json({ error: "Organization name required" }, { status: 400 });
      orgId = cuid();
      await exec(
        "INSERT INTO organizations (id, name, type, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())",
        [orgId, d.org_name, newType]
      );
      await exec(
        "INSERT INTO org_members (id, user_id, organization_id, role, created_at) VALUES ($1, $2, $3, 'admin', NOW())",
        [cuid(), userId, orgId]
      );
    }

    if (newType !== "individual" && orgId) {
      await exec("UPDATE organizations SET type = $1, updated_at = NOW() WHERE id = $2", [newType, orgId]);
    }

    const role = newType === "individual" ? "khatib" : "admin";
    await exec(
      "UPDATE users SET account_type = $1, role = $2, organization_id = $3, updated_at = NOW() WHERE id = $4",
      [newType, role, newType === "individual" ? null : orgId, userId]
    );
  }

  return NextResponse.json({ success: true });
}
