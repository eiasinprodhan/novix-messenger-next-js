import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Friendship from '@/models/Friendship';
import { getUserFromRequest } from '@/lib/auth';
import { getIO } from '@/lib/socket';
import { messaging } from '@/lib/firebase-admin';
import { invalidateFriendsCache } from '@/lib/redis';

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

    // Check if recipient exists or is admin
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const sender = await User.findById(payload.userId);
    if (recipient.role === 'admin' || sender?.role === 'admin') {
      return NextResponse.json({ error: 'Admin accounts cannot send or receive friend requests.' }, { status: 400 });
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

    await invalidateFriendsCache(payload.userId);
    await invalidateFriendsCache(recipientId);

    // Fetch the requester's info to include in the socket event
    const requester = await User.findById(payload.userId).select('name username avatar');

    // Notify the recipient and sender in real-time
    const io = getIO();
    if (io && requester) {
      const payloadData = {
        friendshipId: friendship._id.toString(),
        requester: {
          _id: requester._id.toString(),
          name: requester.name,
          username: requester.username,
          avatar: requester.avatar,
        },
        recipientId,
        recipient: {
          _id: recipient._id.toString(),
          name: recipient.name,
          username: recipient.username,
          avatar: recipient.avatar,
        },
      };
      io.to(`user:${recipientId}`).emit('friend_request', payloadData);
      io.to(`user:${payload.userId}`).emit('friend_request_sent', payloadData);
    }

    // Send FCM push notification if offline
    try {
      const { isUserOnline } = await import('@/lib/socket');
      if (!isUserOnline(recipientId) && recipient.fcmToken && messaging && requester) {
        await messaging.send({
          token: recipient.fcmToken,
          notification: {
            title: 'New Friend Request',
            body: `${requester.name} sent you a friend request.`,
          },
          data: {
            type: 'friend_request',
            requesterId: payload.userId,
          },
        });
        console.log(`[FCM] Friend request push notification sent to ${recipientId}`);
      }
    } catch (e) {
      console.error('[FCM] Failed to send friend request push notification:', e);
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
