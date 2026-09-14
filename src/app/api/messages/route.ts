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
    const before = searchParams.get('before');

    if (!friendId) {
      return NextResponse.json({ error: 'friendId is required' }, { status: 400 });
    }

    const isSelfChat = friendId === payload.userId;

    // Check if either user is an admin or self chat
    const currentUserObj = await User.findById(payload.userId).select('role');
    const targetUserObj = isSelfChat ? currentUserObj : await User.findById(friendId).select('role');
    const isAdminInvolved = currentUserObj?.role === 'admin' || targetUserObj?.role === 'admin';

    if (!isAdminInvolved && !isSelfChat) {
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
    }

    if (!isSelfChat) {
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
    }

    const sortedIds = isSelfChat ? payload.userId : [payload.userId, friendId].sort().join('_');
    const cacheKey = `chat:${sortedIds}:messages:limit:${limit}:${before || 'latest'}`;
    const cachedData = await getCache<{ messages: any[] }>(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    const query: any = isSelfChat
      ? { sender: payload.userId, receiver: payload.userId, isDeleted: false }
      : {
          $or: [
            { sender: payload.userId, receiver: friendId },
            { sender: friendId, receiver: payload.userId },
          ],
          isDeleted: false,
          deletedBy: { $ne: payload.userId },
        };

    if (before) {
      if (before.match(/^[0-9a-fA-F]{24}$/)) {
        const refMsg = await Message.findById(before).select('createdAt');
        if (refMsg) query.createdAt = { $lt: refMsg.createdAt };
      } else {
        const parsedDate = new Date(before);
        if (!isNaN(parsedDate.getTime())) query.createdAt = { $lt: parsedDate };
      }
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'name username avatar')
      .populate({
        path: 'replyTo',
        select: 'content sender type imageUrl',
        populate: { path: 'sender', select: 'name username' },
      });

    const finalResponse = { messages: messages.reverse() };
    await setCache(cacheKey, finalResponse, 120);

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

    const {
      receiverId,
      content,
      type = 'text',
      imageUrl,
      replyTo,
      forwardFrom,
      attachments,
      poll,
      topicId,
      expiresAt,
      encryptedPayload,
      isSilent = false,
      scheduledFor,
    } = await request.json();

    if (!receiverId || (!content && !imageUrl && !attachments?.length && !poll && !forwardFrom && !encryptedPayload)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const isSelfMessage = receiverId === payload.userId;

    // Check if either user is an admin or sending to self (Saved Messages)
    const senderUserObj = await User.findById(payload.userId).select('role');
    const receiverUserObj = isSelfMessage ? senderUserObj : await User.findById(receiverId).select('role');
    const isAdminInvolved = senderUserObj?.role === 'admin' || receiverUserObj?.role === 'admin';

    if (!isAdminInvolved && !isSelfMessage) {
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
    }

    // Determine initial status based on online state
    let initialStatus: 'sent' | 'delivered' | 'read' = isSelfMessage ? 'read' : 'sent';
    if (!isSelfMessage && !isSilent) {
      try {
        const { isUserOnline } = await import('@/lib/socket');
        if (isUserOnline(receiverId)) {
          initialStatus = 'delivered';
        } else {
          // Receiver is offline, send FCM push notification
          const receiverUser = await User.findById(receiverId);
          if (receiverUser?.fcmToken && messaging) {
            const senderUser = await User.findById(payload.userId).select('name avatar');
            try {
              await messaging.send({
                token: receiverUser.fcmToken,
                notification: {
                  title: senderUser?.name || 'New Message',
                  body: type === 'image' ? '📷 Image' : type === 'audio' ? '🎵 Voice message' : type === 'poll' ? '📊 Poll' : (content || ''),
                },
                data: {
                  type: 'message',
                  senderId: payload.userId,
                  senderName: senderUser?.name || '',
                  senderAvatar: senderUser?.avatar || '',
                  silent: isSilent ? '1' : '0',
                },
                android: {
                  priority: isSilent ? 'normal' : 'high',
                  notification: {
                    channelId: 'message_channel_id',
                    icon: '@mipmap/ic_launcher',
                  },
                },
              });
              console.log(`[FCM] Push notification sent to ${receiverId}`);
            } catch (fcmError) {
              console.error('[FCM] Failed to send push notification:', fcmError);
            }
          }
        }
      } catch (e) {}
    }

    const message = await Message.create({
      sender: payload.userId,
      receiver: receiverId,
      content: content || '',
      type,
      imageUrl: imageUrl || null,
      status: initialStatus,
      replyTo: replyTo || null,
      forwardFrom: forwardFrom || undefined,
      attachments: attachments || [],
      poll: poll || undefined,
      topicId: topicId || undefined,
      isSilent: Boolean(isSilent),
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      encryptedPayload: encryptedPayload || null,
      isEphemeralTransit: !isSelfMessage, // Saved Messages persist in cloud
      isDelivered: isSelfMessage || initialStatus === 'delivered',
    });

    const populated = await message.populate('sender', 'name username avatar');

    // Unhide chat for both users on new message
    await User.findByIdAndUpdate(payload.userId, { $pull: { hiddenChats: receiverId } });
    if (!isSelfMessage) {
      await User.findByIdAndUpdate(receiverId, { $pull: { hiddenChats: payload.userId } });
      await invalidateFriendsCache(receiverId);
    }

    await invalidateFriendsCache(payload.userId);
    await invalidateChatCache(payload.userId, receiverId);

    // Emit real-time event via socket (unless scheduled for future)
    const isFutureScheduled = scheduledFor && new Date(scheduledFor).getTime() > Date.now();
    if (!isFutureScheduled) {
      try {
        const { getIO } = await import('@/lib/socket');
        const io = getIO();
        if (io) {
          const roomId = isSelfMessage ? payload.userId : [payload.userId, receiverId].sort().join('_');
          io.to(roomId).emit('new_message', {
            message: populated.toJSON(),
            from: payload.userId,
          });
          if (!isSelfMessage) {
            io.to(`user:${receiverId}`).emit('new_message', {
              message: populated.toJSON(),
              from: payload.userId,
            });
          }
        }
      } catch (e) {
        // Socket not initialized yet - fine for REST fallback
      }
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
