import { NextResponse } from "next/server";
import { getUserId, AuthError } from "@/lib/auth";

export async function withAuth<T>(
  handler: (userId: string) => Promise<T>
): Promise<T | NextResponse> {
  try {
    const userId = await getUserId();
    return await handler(userId);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    throw e;
  }
}

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(e: unknown): NextResponse {
  if (e instanceof AuthError) {
    return apiError("Not authenticated", 401);
  }
  console.error("[API Error]", e instanceof Error ? e.message : e);
  return apiError("Internal server error", 500);
}
