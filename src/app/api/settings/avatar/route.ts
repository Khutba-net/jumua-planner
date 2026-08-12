import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserId, AuthError } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/gif": [0x47, 0x49, 0x46],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
};

function validateMagicBytes(buffer: Buffer, mime: string): boolean {
  const expected = MAGIC_BYTES[mime];
  if (!expected) return false;
  for (let i = 0; i < expected.length; i++) {
    if (buffer[i] !== expected[i]) return false;
  }
  return true;
}

export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(); } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }

  const formData = await req.formData();
  const file = formData.get("avatar") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
  }

  if (!ALLOWED_MIMES.has(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, WebP, and GIF images are allowed" }, { status: 400 });
  }

  const rawName = file.name.replace(/[^a-zA-Z0-9._-]/g, "");
  const ext = rawName.split(".").pop()?.toLowerCase() || "";
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: "Invalid file extension" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (!validateMagicBytes(buffer, file.type)) {
    return NextResponse.json({ error: "File content does not match its type" }, { status: 400 });
  }

  const safeFilename = `${userId.replace(/[^a-zA-Z0-9_-]/g, "")}.${ext}`;
  const avatarsDir = path.join(process.cwd(), "public", "avatars");
  const filepath = path.resolve(avatarsDir, safeFilename);

  if (!filepath.startsWith(avatarsDir)) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  await writeFile(filepath, buffer);

  const avatarUrl = `/avatars/${safeFilename}`;
  db.prepare("UPDATE users SET avatar_url = ?, updated_at = datetime('now') WHERE id = ?").run(avatarUrl, userId);

  return NextResponse.json({ avatar_url: avatarUrl });
}
