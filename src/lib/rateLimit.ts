interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory sliding window token bucket store
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup expired buckets every 5 minutes to prevent memory leaks on 1GB VPS
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  limit: number;      // Maximum allowed requests in window
  windowMs: number;   // Window duration in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    const resetTime = now + config.windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetTime,
      retryAfterSeconds: Math.ceil(config.windowMs / 1000),
    };
  }

  record.count += 1;
  const remaining = Math.max(0, config.limit - record.count);
  const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));

  if (record.count > config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfterSeconds,
    };
  }

  return {
    success: true,
    limit: config.limit,
    remaining,
    resetTime: record.resetTime,
    retryAfterSeconds,
  };
}

// Default presets for different endpoint categories
export const RATE_LIMIT_PRESETS: Record<string, RateLimitConfig> = {
  auth: { limit: 10, windowMs: 60 * 1000 },      // 10 requests / min (brute-force protection)
  upload: { limit: 30, windowMs: 60 * 1000 },    // 30 uploads / min (anti-disk flood)
  messages: { limit: 120, windowMs: 60 * 1000 }, // 120 messages / min (anti-spam)
  general: { limit: 200, windowMs: 60 * 1000 },  // 200 general requests / min
};
