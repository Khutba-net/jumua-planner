import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const userId = await getUserId();

  const formData = await req.formData();
  const file = formData.get("avatar") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${userId}.${ext}`;
  const filepath = path.join(process.cwd(), "public", "avatars", filename);

  await writeFile(filepath, buffer);

  const avatarUrl = `/avatars/${filename}`;
  db.prepare("UPDATE users SET avatar_url = ?, updated_at = datetime('now') WHERE id = ?").run(avatarUrl, userId);

  return NextResponse.json({ avatar_url: avatarUrl });
}
