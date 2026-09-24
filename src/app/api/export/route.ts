import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: (e as AuthError).status });
    throw e;
  }

  const user = await queryOne("SELECT id, name, email, bio, phone FROM users WHERE id = $1", [userId]);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const settings = await queryOne("SELECT * FROM user_settings WHERE user_id = $1", [userId]);
  const themes = await query("SELECT * FROM themes WHERE owner_id = $1", [userId]);
  const subTopics = await query("SELECT st.* FROM sub_topics st JOIN themes t ON st.theme_id = t.id WHERE t.owner_id = $1", [userId]);
  const sermons = await query("SELECT * FROM sermons WHERE author_id = $1", [userId]);
  const sermonIds = sermons.map((s) => s.id as string);

  let references: unknown[] = [];
  let feedback: unknown[] = [];
  if (sermonIds.length > 0) {
    const placeholders = sermonIds.map((_, i) => `$${i + 1}`).join(",");
    references = await query(`SELECT * FROM references_ WHERE sermon_id IN (${placeholders})`, sermonIds);
    feedback = await query(`SELECT * FROM feedback WHERE sermon_id IN (${placeholders})`, sermonIds);
  }

  const exportData = {
    exported_at: new Date().toISOString(),
    user,
    settings,
    themes,
    sub_topics: subTopics,
    sermons,
    references,
    feedback,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="khutba-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
