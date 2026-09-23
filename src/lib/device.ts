import { NextRequest } from 'next/server';
import User from '@/models/User';

// In-memory cache to throttle device activity updates to at most once per 5 minutes per device
const recentUpdates = new Map<string, number>();
const THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

export async function updateDeviceActivity(userId: string, req: NextRequest) {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId || !userId) return;

  const cacheKey = `${userId}:${deviceId}`;
  const now = Date.now();
  const lastUpdate = recentUpdates.get(cacheKey);

  if (lastUpdate && now - lastUpdate < THROTTLE_MS) {
    return; // Throttled, no need to touch MongoDB
  }

  recentUpdates.set(cacheKey, now);

  // Prune cache occasionally to prevent memory leak
  if (recentUpdates.size > 10000) {
    const expiredCutoff = now - THROTTLE_MS;
    for (const [k, ts] of recentUpdates.entries()) {
      if (ts < expiredCutoff) recentUpdates.delete(k);
    }
  }

  const deviceName = req.headers.get('x-device-name') || 'Unknown Device';
  const deviceType = req.headers.get('x-device-type') || 'unknown';
  const os = req.headers.get('x-device-os') || '';
  const browser = req.headers.get('x-device-browser') || '';

  // Extract IP Address robustly
  const forwarded = req.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

  try {
    const nowTime = new Date();

    // 1. Try to update existing device atomically (0 full document re-saves)
    const updateResult = await User.updateOne(
      { _id: userId, 'devices.deviceId': deviceId },
      {
        $set: {
          'devices.$.lastActiveAt': nowTime,
          'devices.$.deviceName': deviceName,
          'devices.$.deviceType': deviceType,
          'devices.$.os': os,
          'devices.$.browser': browser,
          'devices.$.ipAddress': ipAddress,
          lastActiveAt: nowTime,
        },
      }
    );

    // 2. If device was not found in array, push it
    if (updateResult.matchedCount === 0) {
      await User.updateOne(
        { _id: userId },
        {
          $push: {
            devices: {
              deviceId,
              deviceName,
              deviceType,
              os,
              browser,
              ipAddress,
              lastActiveAt: nowTime,
            },
          },
          $set: { lastActiveAt: nowTime },
        }
      );
    }
  } catch (error) {
    console.error('Failed to update device activity:', error);
  }
}
