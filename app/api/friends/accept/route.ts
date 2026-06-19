import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Friendship from '@/models/Friendship';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { friendshipId } = await request.json();

    const friendship = await Friendship.findById(friendshipId);

    if (!friendship) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }

    // Only the recipient can accept
    if (friendship.recipient.toString() !== payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (friendship.status !== 'pending') {
      return NextResponse.json({ error: 'Request is no longer pending' }, { status: 400 });
    }

    friendship.status = 'accepted';
    await friendship.save();

    return NextResponse.json({
      success: true,
      message: 'Friend request accepted',
      friendship,
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to accept request' }, { status: 500 });
  }
}
