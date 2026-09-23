import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let redis: Redis | null = null;
let isRedisAvailable = false;
let hasLoggedError = false;

// ─── Fast In-Memory Fallback Cache (Active when Redis is offline) ───────────
interface CacheEntry {
  value: any;
  expiresAt: number;
}
const memoryCache = new Map<string, CacheEntry>();

function getMemoryCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value as T;
}

function setMemoryCache(key: string, value: any, ttlSeconds: number) {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });

  // Prune periodically
  if (memoryCache.size > 5000) {
    const now = Date.now();
    for (const [k, v] of memoryCache.entries()) {
      if (now > v.expiresAt) memoryCache.delete(k);
    }
  }
}

function deleteMemoryCache(key: string) {
  memoryCache.delete(key);
}

function invalidateMemoryKeys(pattern: string) {
  // Convert glob pattern to regex (e.g. user:123:friends:* -> ^user:123:friends:.*$)
  const regexStr = '^' + pattern.replace(/([.+?^=!:${}()|\[\]\/\\])/g, '\\$1').replace(/\*/g, '.*') + '$';
  const regex = new RegExp(regexStr);
  for (const k of memoryCache.keys()) {
    if (regex.test(k)) {
      memoryCache.delete(k);
    }
  }
}

try {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 500, // reduce connect timeout to 500ms for faster failover
    enableOfflineQueue: false, // fail instantly if offline instead of queuing commands
    retryStrategy(times) {
      if (times > 2) {
        isRedisAvailable = false;
        if (!hasLoggedError) {
          console.warn('⚠️ Redis is unreachable. Falling back to high-speed in-memory cache.');
          hasLoggedError = true;
        }
        return null;
      }
      return 2000;
    },
  });

  redis.on('connect', () => {
    isRedisAvailable = true;
    hasLoggedError = false;
    console.log('📡 Redis connection established successfully.');
  });

  redis.on('error', (err) => {
    isRedisAvailable = false;
    if (!hasLoggedError) {
      console.warn('⚠️ Redis connection unavailable (using in-memory fallback):', err.message);
      hasLoggedError = true;
    }
  });
} catch (error) {
  if (!hasLoggedError) {
    console.warn('⚠️ Redis not configured, using in-memory cache.');
    hasLoggedError = true;
  }
  redis = null;
}

export async function getCache<T>(key: string): Promise<T | null> {
  if (redis && isRedisAvailable) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return getMemoryCache<T>(key);
    }
  }
  return getMemoryCache<T>(key);
}

export async function setCache(key: string, value: any, ttlSeconds = 300): Promise<boolean> {
  setMemoryCache(key, value, ttlSeconds);
  if (redis && isRedisAvailable) {
    try {
      const stringified = JSON.stringify(value);
      await redis.set(key, stringified, 'EX', ttlSeconds);
      return true;
    } catch (error) {
      return true; // Still cached in memory
    }
  }
  return true;
}

export async function deleteCache(key: string): Promise<boolean> {
  deleteMemoryCache(key);
  if (redis && isRedisAvailable) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      return false;
    }
  }
  return true;
}

export async function invalidateKeys(pattern: string): Promise<boolean> {
  invalidateMemoryKeys(pattern);
  if (redis && isRedisAvailable) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return true;
    } catch (error) {
      return false;
    }
  }
  return true;
}

export async function invalidateFriendsCache(userId: string): Promise<void> {
  await invalidateKeys(`user:${userId}:friends:*`);
}

export async function invalidateChatCache(userId1: string, userId2: string): Promise<void> {
  const sortedIds = [userId1, userId2].sort().join('_');
  await invalidateKeys(`chat:${sortedIds}:messages:*`);
}
