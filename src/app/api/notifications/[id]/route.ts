import { NextResponse } from "next/server";
import { getUserId, AuthError } from "@/lib/auth";
import { exec } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_req: Request, { params }: Params) {
  try {
    const userId = await getUserId();
    const { id } = await params;

    await exec(
      "UPDATE notifications SET read = 1 WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }
}
