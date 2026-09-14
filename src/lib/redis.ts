import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let redis: Redis | null = null;
let isRedisAvailable = false;
let hasLoggedError = false;

try {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 500, // reduce connect timeout to 500ms for faster failover
    enableOfflineQueue: false, // fail instantly if offline instead of queuing commands
    retryStrategy(times) {
      if (times > 2) {
        isRedisAvailable = false;
        if (!hasLoggedError) {
          console.warn('⚠️ Redis is unreachable. Falling back to SQLite.');
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
      console.warn('⚠️ Redis connection unavailable (using SQLite fallback):', err.message);
      hasLoggedError = true;
    }
  });
} catch (error) {
  if (!hasLoggedError) {
    console.warn('⚠️ Redis not configured, falling back to SQLite.');
    hasLoggedError = true;
  }
  redis = null;
}

export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis || !isRedisAvailable) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn(`⚠️ Redis getCache error for key ${key}:`, error);
    return null;
  }
}

export async function setCache(key: string, value: any, ttlSeconds = 300): Promise<boolean> {
  if (!redis || !isRedisAvailable) return false;
  try {
    const stringified = JSON.stringify(value);
    await redis.set(key, stringified, 'EX', ttlSeconds);
    return true;
  } catch (error) {
    console.warn(`⚠️ Redis setCache error for key ${key}:`, error);
    return false;
  }
}

export async function deleteCache(key: string): Promise<boolean> {
  if (!redis || !isRedisAvailable) return false;
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.warn(`⚠️ Redis deleteCache error for key ${key}:`, error);
    return false;
  }
}

export async function invalidateKeys(pattern: string): Promise<boolean> {
  if (!redis || !isRedisAvailable) return false;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return true;
  } catch (error) {
    console.warn(`⚠️ Redis invalidateKeys error for pattern ${pattern}:`, error);
    return false;
  }
}

export async function invalidateFriendsCache(userId: string): Promise<void> {
  await invalidateKeys(`user:${userId}:friends:*`);
}

export async function invalidateChatCache(userId1: string, userId2: string): Promise<void> {
  const sortedIds = [userId1, userId2].sort().join('_');
  await invalidateKeys(`chat:${sortedIds}:messages:*`);
}
