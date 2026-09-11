import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hits = new Map<string, { count: number; resetAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of hits) {
    if (entry.resetAt <= now) hits.delete(key);
  }
}, 60_000);

let _upstash: Ratelimit | null = null;
function getUpstash(limit: number, windowMs: number) {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null;
  if (!_upstash) {
    _upstash = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(limit, `${windowMs}ms`),
    });
  }
  return _upstash;
}

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  entry.count++;
  const remaining = Math.max(0, limit - entry.count);
  return { allowed: entry.count <= limit, remaining };
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  return memoryRateLimit(key, limit, windowMs);
}

export async function rateLimitAsync(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  const upstash = getUpstash(limit, windowMs);
  if (upstash) {
    const result = await upstash.limit(key);
    return { allowed: result.success, remaining: result.remaining };
  }
  return memoryRateLimit(key, limit, windowMs);
}

export function rateLimitByIp(
  ip: string,
  endpoint: string,
  limit: number,
  windowMs: number
) {
  return rateLimit(`${endpoint}:${ip}`, limit, windowMs);
}
