import { NextRequest, NextResponse } from "next/server";
import { query, cuid, toJSON } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";
import { sermonCreateSchema, parseBody } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: (e as AuthError).status });
    throw e;
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let sql = `
    SELECT s.*, t.name as theme_name, t.color as theme_color,
           u.name as author_name
    FROM sermons s
    LEFT JOIN themes t ON s.theme_id = t.id
    LEFT JOIN users u ON s.author_id = u.id
    WHERE s.author_id = $1
  `;
  const params: unknown[] = [userId];

  if (status) {
    sql += " AND s.status = $2";
    params.push(status);
  }

  sql += " ORDER BY s.updated_at DESC";

  try {
    const sermons = await query(sql, params);
    return NextResponse.json(toJSON(sermons));
  } catch (err) {
    console.error("Failed to load sermons", err);
    return NextResponse.json({ error: "Failed to load sermons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: (e as AuthError).status });
    throw e;
  }

  const body = await req.json();
  const parsed = parseBody(sermonCreateSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const d = parsed.data;
  const id = cuid();

  let themeId = d.themeId ?? null;
  let subTopicId = d.subTopicId ?? null;
  let scheduledDate = d.scheduledDate ?? null;

  // Auto-allocate to annual plan if no theme specified
  if (!themeId) {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const seasonStartMonth = Math.floor((currentMonth - 1) / 3) * 3 + 1;

      // Find a theme in the current season
      const userRow = await query("SELECT organization_id FROM users WHERE id = $1", [userId]);
      const orgId = userRow[0]?.organization_id || "";
      const themes = await query(
        `SELECT id FROM themes WHERE (owner_id = $1 OR (organization_id = $2 AND organization_id IS NOT NULL)) AND year = $3 AND month >= $4 AND month <= $5 ORDER BY month ASC LIMIT 1`,
        [userId, orgId, currentYear, seasonStartMonth, seasonStartMonth + 2]
      );

      if (themes.length > 0) {
        themeId = themes[0].id;

        // Pick the first sub-topic if available
        const subs = await query(
          `SELECT id FROM sub_topics WHERE theme_id = $1 ORDER BY week_number ASC LIMIT 1`,
          [themeId]
        );
        if (subs.length > 0) subTopicId = subs[0].id;

        // Auto-assign a date if none given
        if (!scheduledDate) {
          const seasonEnd = new Date(currentYear, seasonStartMonth + 2, 0);
          // Find existing dates in this theme to avoid collisions
          const existing = await query(
            `SELECT scheduled_date FROM sermons WHERE theme_id = $1 AND scheduled_date IS NOT NULL`,
            [themeId]
          );
          const taken = new Set(existing.map((r) => (r.scheduled_date as string)?.slice(0, 10)));

          // Start from next Friday (or today if Friday)
          const d2 = new Date(now);
          d2.setDate(d2.getDate() + ((5 - d2.getDay() + 7) % 7 || 7));
          // Find next available Friday
          while (d2 <= seasonEnd) {
            const iso = `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, "0")}-${String(d2.getDate()).padStart(2, "0")}`;
            if (!taken.has(iso)) {
              scheduledDate = iso;
              break;
            }
            d2.setDate(d2.getDate() + 7);
          }
        }
      }
    } catch (err) {
      console.error("Auto-allocate failed, creating without theme", err);
    }
  }

  try {
    await query(
      `INSERT INTO sermons (id, title, content, outline, status, type, scheduled_date, notes, author_id, mosque_id, theme_id, sub_topic_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id,
        d.title || "Untitled Sermon",
        d.content ?? "",
        d.outline ?? "",
        d.status ?? "draft",
        d.type ?? "friday",
        scheduledDate,
        d.notes ?? "",
        userId,
        d.mosqueId ?? null,
        themeId,
        subTopicId,
      ]
    );
  } catch (err) {
    console.error("Failed to create sermon", err);
    return NextResponse.json({ error: "Failed to create sermon" }, { status: 500 });
  }

  const sermon = await query("SELECT * FROM sermons WHERE id = $1", [id]);
  return NextResponse.json(toJSON(sermon[0]), { status: 201 });
}
