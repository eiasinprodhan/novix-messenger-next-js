import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import Friendship from '@/models/Friendship';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import { messaging } from '@/lib/firebase-admin';
import { getCache, setCache, invalidateFriendsCache, invalidateChatCache } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const friendId = searchParams.get('friendId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!friendId) {
      return NextResponse.json({ error: 'friendId is required' }, { status: 400 });
    }

    // Verify they are friends
    const friendship = await Friendship.findOne({
      $or: [
        { requester: payload.userId, recipient: friendId, status: 'accepted' },
        { requester: friendId, recipient: payload.userId, status: 'accepted' },
      ],
    });

    if (!friendship) {
      return NextResponse.json({ error: 'You are not friends with this user' }, { status: 403 });
    }

    // Mark messages sent by friendId to current user as 'read'
    const updateResult = await Message.updateMany(
      { sender: friendId, receiver: payload.userId, status: { $ne: 'read' } },
      { status: 'read' }
    );

    if (updateResult.modifiedCount > 0) {
      await invalidateFriendsCache(payload.userId);
      await invalidateFriendsCache(friendId);
      await invalidateChatCache(payload.userId, friendId);
    }

    const sortedIds = [payload.userId, friendId].sort().join('_');
    const cacheKey = `chat:${sortedIds}:messages:limit:${limit}`;
    const cachedData = await getCache<{ messages: any[] }>(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // Emit read receipt event via socket
    try {
      const { getIO } = await import('@/lib/socket');
      const io = getIO();
      if (io) {
        const roomId = [payload.userId, friendId].sort().join('_');
        io.to(roomId).emit('messages_read', {
          readerId: payload.userId,
          senderId: friendId,
        });
      }
    } catch (e) {
      // ignore socket errors
    }

    const messages = await Message.find({
      $or: [
        { sender: payload.userId, receiver: friendId },
        { sender: friendId, receiver: payload.userId },
      ],
      isDeleted: false,
      deletedBy: { $ne: payload.userId },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'name username avatar')
      .populate({
        path: 'replyTo',
        select: 'content sender type imageUrl',
        populate: { path: 'sender', select: 'name username' }
      });

    const finalResponse = { messages: messages.reverse() };
    await setCache(cacheKey, finalResponse, 600); // cache messages for 10 minutes

    return NextResponse.json(finalResponse);
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiverId, content, type = 'text', imageUrl, replyTo } = await request.json();

    if (!receiverId || (!content && !imageUrl)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify friendship
    const friendship = await Friendship.findOne({
      $or: [
        { requester: payload.userId, recipient: receiverId, status: 'accepted' },
        { requester: receiverId, recipient: payload.userId, status: 'accepted' },
      ],
    });

    if (!friendship) {
      return NextResponse.json({ error: 'You can only chat with friends' }, { status: 403 });
    }

    // Determine initial status based on online state
    let initialStatus: 'sent' | 'delivered' | 'read' = 'sent';
    try {
      const { isUserOnline } = await import('@/lib/socket');
      if (isUserOnline(receiverId)) {
        initialStatus = 'delivered';
      } else {
        // Receiver is offline, send FCM push notification
        const receiverUser = await User.findById(receiverId);
        if (receiverUser?.fcmToken && messaging) {
          const senderUser = await User.findById(payload.userId);
          try {
            await messaging.send({
              token: receiverUser.fcmToken,
              notification: {
                title: senderUser?.name || 'New Message',
                body: type === 'image' ? '📷 Image' : content,
              },
              data: {
                type: 'new_message',
                senderId: payload.userId,
              },
            });
            console.log(`[FCM] Push notification sent to ${receiverId}`);
          } catch (fcmError) {
            console.error('[FCM] Failed to send push notification:', fcmError);
          }
        }
      }
    } catch (e) {}

    const message = await Message.create({
      sender: payload.userId,
      receiver: receiverId,
      content: content || '',
      type,
      imageUrl: imageUrl || null,
      status: initialStatus,
      replyTo: replyTo || null,
    });

    const populated = await message.populate('sender', 'name username avatar');

    // Unhide chat for both users on new message
    await User.findByIdAndUpdate(payload.userId, { $pull: { hiddenChats: receiverId } });
    await User.findByIdAndUpdate(receiverId, { $pull: { hiddenChats: payload.userId } });

    await invalidateFriendsCache(payload.userId);
    await invalidateFriendsCache(receiverId);
    await invalidateChatCache(payload.userId, receiverId);

    // Emit real-time event via socket
    try {
      const { getIO } = await import('@/lib/socket');
      const io = getIO();
      if (io) {
        const roomId = [payload.userId, receiverId].sort().join('_');
        io.to(roomId).emit('new_message', {
          message: populated.toObject(),
          from: payload.userId,
        });
        io.to(`user:${receiverId}`).emit('new_message', {
          message: populated.toObject(),
          from: payload.userId,
        });
      }
    } catch (e) {
      // Socket not initialized yet - fine for REST fallback
    }

    return NextResponse.json({
      success: true,
      message: populated,
    }, { status: 201 });

  } catch (error) {
    console.error('Messages POST error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
