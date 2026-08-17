import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const memoryHits = new Map<string, { count: number; reset: number }>();

const durableLimiter =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(20, "1 m"),
        prefix: "biogrid:avistamientos",
        timeout: 1_500,
      })
    : null;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export async function limitAvistamientos(userId: string): Promise<RateLimitResult> {
  if (durableLimiter) return durableLimiter.limit(userId);

  if (process.env.NODE_ENV === "production") {
    throw new Error("RATE_LIMIT_NOT_CONFIGURED");
  }

  const now = Date.now();
  const current = memoryHits.get(userId);
  const entry = !current || current.reset <= now
    ? { count: 0, reset: now + 60_000 }
    : current;
  entry.count += 1;
  memoryHits.set(userId, entry);

  return {
    success: entry.count <= 20,
    limit: 20,
    remaining: Math.max(0, 20 - entry.count),
    reset: entry.reset,
  };
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
  };
}
