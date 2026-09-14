import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Friendship from '@/models/Friendship';
import { getUserFromRequest } from '@/lib/auth';
import { invalidateFriendsCache } from '@/lib/redis';

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

    const recipientId = (friendship.recipient?._id || friendship.recipient?.id || friendship.recipient)?.toString();
    const requesterId = (friendship.requester?._id || friendship.requester?.id || friendship.requester)?.toString();

    // Only the recipient can accept
    if (recipientId !== payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (friendship.status !== 'pending') {
      return NextResponse.json({ error: 'Request is no longer pending' }, { status: 400 });
    }

    friendship.status = 'accepted';
    await friendship.save();

    if (requesterId) await invalidateFriendsCache(requesterId);
    if (recipientId) await invalidateFriendsCache(recipientId);

    try {
      const { getIO } = await import('@/lib/socket');
      const io = getIO();
      if (io) {
        io.to(`user:${requesterId}`).emit('friend_request_accepted', { friendshipId, userId: recipientId });
        io.to(`user:${recipientId}`).emit('friend_request_accepted', { friendshipId, userId: requesterId });
      }
    } catch (_) {}

    return NextResponse.json({
      success: true,
      message: 'Friend request accepted',
      friendship,
    });

  } catch (error) {
    console.error('Accept friend request error:', error);
    return NextResponse.json({ error: 'Failed to accept request' }, { status: 500 });
  }
}
