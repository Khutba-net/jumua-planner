import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, cuid, toJSON } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: (e as AuthError).status });
    throw e;
  }

  const body = await req.json();
  const fromYear = Number(body.fromYear);
  const toYear = Number(body.toYear);
  if (!fromYear || !toYear || fromYear === toYear) {
    return NextResponse.json({ error: "Invalid year parameters" }, { status: 400 });
  }

  const user = await queryOne<{ organization_id: string | null; role: string }>(
    "SELECT organization_id, role FROM users WHERE id = $1", [userId]
  );

  const existingThemes = await query<{ id: string }>(
    "SELECT id FROM themes WHERE (owner_id = $1 OR (organization_id = $2 AND organization_id IS NOT NULL)) AND year = $3",
    [userId, user?.organization_id || "", toYear]
  );
  if (existingThemes.length > 0) {
    return NextResponse.json({ error: "Target year already has themes. Delete them first or choose a different year." }, { status: 409 });
  }

  const sourceThemes = await query<Record<string, unknown>>(
    "SELECT * FROM themes WHERE (owner_id = $1 OR (organization_id = $2 AND organization_id IS NOT NULL)) AND year = $3 ORDER BY month ASC",
    [userId, user?.organization_id || "", fromYear]
  );

  if (sourceThemes.length === 0) {
    return NextResponse.json({ error: "No themes found in source year" }, { status: 404 });
  }

  const isOrgAdmin = user?.role === "admin" && user?.organization_id;
  const imported = [];

  for (const theme of sourceThemes) {
    const newId = cuid();
    await query(
      "INSERT INTO themes (id, name, description, month, year, color, owner_id, organization_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [newId, theme.name, theme.description || "", theme.month, toYear, theme.color || "#00666d", userId, isOrgAdmin ? user.organization_id : null]
    );

    const subTopics = await query<Record<string, unknown>>(
      "SELECT * FROM sub_topics WHERE theme_id = $1 ORDER BY week_number ASC",
      [theme.id as string]
    );

    for (const st of subTopics) {
      await query(
        "INSERT INTO sub_topics (id, name, week_number, theme_id) VALUES ($1, $2, $3, $4)",
        [cuid(), st.name, st.week_number, newId]
      );
    }

    imported.push({ id: newId, name: theme.name, month: theme.month });
  }

  return NextResponse.json(toJSON({ imported, count: imported.length }), { status: 201 });
}
