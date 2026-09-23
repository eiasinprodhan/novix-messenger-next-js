import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { isUserOnline } from '@/lib/socket';
import { getCache, setCache } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rawIds = searchParams.get('ids');
    if (!rawIds || !rawIds.trim()) {
      return NextResponse.json({ users: [] });
    }

    const userIds = rawIds.split(',').filter(Boolean);
    if (userIds.length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Sort IDs for a consistent cache key
    const sortedKey = [...userIds].sort().join(',');
    const cacheKey = `presence:${sortedKey}`;
    const cached = await getCache<{ users: any[] }>(cacheKey);
    if (cached) {
      // Refresh real-time socket online status dynamically
      const dynamicUsers = cached.users.map((u) => ({
        ...u,
        isOnline: isUserOnline(u._id.toString()) || u.isOnline,
      }));
      return NextResponse.json({ users: dynamicUsers });
    }

    const users = await User.find({ _id: { $in: userIds } })
      .select('_id isOnline lastSeen')
      .lean();

    // Merge with real-time socket presence
    const result = users.map((user: any) => ({
      _id: user._id,
      isOnline: isUserOnline(user._id.toString()) || user.isOnline,
      lastSeen: user.lastSeen,
    }));

    const responseData = { users: result };
    // Cache for 3 seconds to coalesce concurrent presence polling spikes
    await setCache(cacheKey, responseData, 3);

    return NextResponse.json(responseData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch presence' }, { status: 500 });
  }
}
