import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set([
  "/",
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/cleanup-sessions",
]);

const PUBLIC_PREFIXES = ["/api/invite/", "/invite/"];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (pathname.startsWith("/_next/") || pathname.startsWith("/favicon") || pathname.startsWith("/avatars/")) return true;
  if (/\.(jpg|jpeg|png|gif|svg|ico|webp|woff2?|ttf|css|js|map)$/i.test(pathname)) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return addSecurityHeaders(NextResponse.next());
  }

  const token = request.cookies.get("session")?.value;

  if (!token || token.length !== 64) {
    if (pathname.startsWith("/api/")) {
      return addSecurityHeaders(
        NextResponse.json({ error: "Not authenticated" }, { status: 401 })
      );
    }
    const loginUrl = new URL("/auth/login", request.url);
    return addSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  return addSecurityHeaders(NextResponse.next());
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
