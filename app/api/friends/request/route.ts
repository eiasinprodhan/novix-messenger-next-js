import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Friendship from '@/models/Friendship';
import { getUserFromRequest } from '@/lib/auth';
import { getIO } from '@/lib/socket';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipientId } = await request.json();

    if (!recipientId || recipientId === payload.userId) {
      return NextResponse.json({ error: 'Invalid recipient' }, { status: 400 });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check existing friendship
    const existing = await Friendship.findOne({
      $or: [
        { requester: payload.userId, recipient: recipientId },
        { requester: recipientId, recipient: payload.userId },
      ],
    });

    if (existing) {
      return NextResponse.json(
        { error: `Friend request already exists (${existing.status})` },
        { status: 400 }
      );
    }

    const friendship = await Friendship.create({
      requester: payload.userId,
      recipient: recipientId,
      status: 'pending',
    });

    // Fetch the requester's info to include in the socket event
    const requester = await User.findById(payload.userId).select('name username avatar');

    // Notify the recipient in real-time
    const io = getIO();
    if (io && requester) {
      io.to(`user:${recipientId}`).emit('friend_request', {
        friendshipId: friendship._id.toString(),
        requester: {
          _id: requester._id.toString(),
          name: requester.name,
          username: requester.username,
          avatar: requester.avatar,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Friend request sent',
      friendship,
    }, { status: 201 });

  } catch (error) {
    console.error('Friend request error:', error);
    return NextResponse.json({ error: 'Failed to send friend request' }, { status: 500 });
  }
}
