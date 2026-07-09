import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { isUserOnline } from '@/lib/socket';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userIds = searchParams.get('ids')?.split(',') || [];

    if (userIds.length === 0) {
      return NextResponse.json({ users: [] });
    }

    const users = await User.find({ _id: { $in: userIds } })
      .select('_id isOnline lastSeen');

    // Merge with real-time socket presence
    const result = users.map((user: any) => ({
      _id: user._id,
      isOnline: isUserOnline(user._id.toString()) || user.isOnline,
      lastSeen: user.lastSeen,
    }));

    return NextResponse.json({ users: result });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch presence' }, { status: 500 });
  }
}
