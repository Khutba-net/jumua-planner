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

const STRIPE_CHECKOUT_LIMIT = 3;
const STRIPE_CHECKOUT_WINDOW = 60_000;
const API_GLOBAL_LIMIT = 60;
const API_GLOBAL_WINDOW = 60_000;

const memHits = new Map<string, { count: number; resetAt: number }>();

async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    const windowSec = Math.ceil(windowMs / 1000);
    const redisKey = `rl:${key}`;
    try {
      const res = await fetch(`${upstashUrl}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${upstashToken}`, "Content-Type": "application/json" },
        body: JSON.stringify([["INCR", redisKey], ["EXPIRE", redisKey, windowSec]]),
      });
      const data = await res.json() as { result: number }[];
      const count = data[0]?.result ?? 1;
      return count <= limit;
    } catch {
      // Fall through to in-memory on Redis failure
    }
  }

  const now = Date.now();
  const entry = memHits.get(key);
  if (!entry || entry.resetAt <= now) {
    memHits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= limit;
}

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = generateNonce();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  if (isPublicRoute(pathname)) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    return addSecurityHeaders(response, nonce);
  }

  const token = request.cookies.get("session")?.value;

  if (!token || token.length !== 64) {
    if (pathname.startsWith("/api/")) {
      return addSecurityHeaders(
        NextResponse.json({ error: "Not authenticated" }, { status: 401 }), nonce
      );
    }
    const loginUrl = new URL("/auth/login", request.url);
    return addSecurityHeaders(NextResponse.redirect(loginUrl), nonce);
  }

  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    if (pathname === "/api/stripe/checkout") {
      if (!(await checkRateLimit(`stripe:${ip}`, STRIPE_CHECKOUT_LIMIT, STRIPE_CHECKOUT_WINDOW))) {
        return addSecurityHeaders(
          NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 }), nonce
        );
      }
    }

    if (!(await checkRateLimit(`api:${ip}`, API_GLOBAL_LIMIT, API_GLOBAL_WINDOW))) {
      return addSecurityHeaders(
        NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 }), nonce
      );
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  return addSecurityHeaders(response, nonce);
}

function addSecurityHeaders(response: NextResponse, nonce: string): NextResponse {
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
      `script-src 'self' 'nonce-${nonce}'`,
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self' https://*.stripe.com https://*.sentry.io https://*.vercel-insights.com https://*.vercel-analytics.com",
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
