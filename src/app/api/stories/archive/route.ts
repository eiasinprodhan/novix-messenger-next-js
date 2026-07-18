import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Story from '@/models/Story';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stories = await Story.find({
      user: payload.userId,
      isArchived: true,
    })
      .sort({ createdAt: -1 })
      .populate([
        { path: 'user', select: 'name username avatar' },
        { path: 'reactions.user', select: 'name username avatar' },
        { path: 'viewers', select: 'name username avatar' }
      ]);

    return NextResponse.json({ success: true, stories });
  } catch (error) {
    console.error('Stories archive GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch archived stories' }, { status: 500 });
  }
}
