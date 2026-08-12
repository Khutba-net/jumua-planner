import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }

  const user = db.prepare("SELECT id, name, email, bio, phone FROM users WHERE id = ?").get(userId) as Record<string, unknown> | undefined;
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const settings = db.prepare("SELECT * FROM user_settings WHERE user_id = ?").get(userId);
  const themes = db.prepare("SELECT * FROM themes WHERE owner_id = ?").all(userId);
  const subTopics = db.prepare("SELECT st.* FROM sub_topics st JOIN themes t ON st.theme_id = t.id WHERE t.owner_id = ?").all(userId);
  const sermons = db.prepare("SELECT * FROM sermons WHERE author_id = ?").all(userId);
  const sermonIds = (sermons as { id: string }[]).map((s) => s.id);

  let references: unknown[] = [];
  let feedback: unknown[] = [];
  if (sermonIds.length > 0) {
    const placeholders = sermonIds.map(() => "?").join(",");
    references = db.prepare(`SELECT * FROM references_ WHERE sermon_id IN (${placeholders})`).all(...sermonIds);
    feedback = db.prepare(`SELECT * FROM feedback WHERE sermon_id IN (${placeholders})`).all(...sermonIds);
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
      "Content-Disposition": `attachment; filename="jumua-planner-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
