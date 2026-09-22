import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set([
  "/",
  "/privacy",
  "/terms",
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
  "/api/auth/cleanup-sessions",
  "/api/stripe/webhook",
]);

const PUBLIC_PREFIXES = ["/api/invite/", "/invite/", "/api/mosque-invite/", "/mosque-invite/"];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (pathname.startsWith("/_next/") || pathname.startsWith("/favicon") || pathname.startsWith("/avatars/")) return true;
  if (/\.(jpg|jpeg|png|gif|svg|ico|webp|woff2?|ttf|css|js|map)$/i.test(pathname)) return true;
  return false;
}

const apiHits = new Map<string, { count: number; resetAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of apiHits) {
    if (entry.resetAt <= now) apiHits.delete(key);
  }
}, 30_000);

const STRIPE_CHECKOUT_LIMIT = 3;
const STRIPE_CHECKOUT_WINDOW = 60_000;
const API_GLOBAL_LIMIT = 60;
const API_GLOBAL_WINDOW = 60_000;

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = apiHits.get(key);
  if (!entry || entry.resetAt <= now) {
    apiHits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= limit;
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

  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    if (pathname === "/api/stripe/checkout") {
      if (!checkRateLimit(`stripe:${ip}`, STRIPE_CHECKOUT_LIMIT, STRIPE_CHECKOUT_WINDOW)) {
        return addSecurityHeaders(
          NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 })
        );
      }
    }

    if (!checkRateLimit(`api:${ip}`, API_GLOBAL_LIMIT, API_GLOBAL_WINDOW)) {
      return addSecurityHeaders(
        NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 })
      );
    }
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
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "img-src 'self' data: blob:",
      "connect-src 'self' https://*.sentry.io https://*.vercel-insights.com https://*.vercel-analytics.com",
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
