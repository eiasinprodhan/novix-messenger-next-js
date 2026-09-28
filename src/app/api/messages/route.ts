import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import Friendship from '@/models/Friendship';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import Product from '@/models/Product';
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

    // Check if either user is an admin
    const currentUserObj = await User.findById(payload.userId).select('role');
    const targetUserObj = await User.findById(friendId).select('role');
    const isAdminInvolved = currentUserObj?.role === 'admin' || targetUserObj?.role === 'admin';

    const isSelfSavedMessages = friendId === payload.userId;

    if (!isAdminInvolved && !isSelfSavedMessages) {
      const friendship = await Friendship.findOne({
        $or: [
          { requester: payload.userId, recipient: friendId },
          { requester: friendId, recipient: payload.userId },
        ],
      });

      if (friendship?.status === 'blocked') {
        return NextResponse.json({ error: 'Cannot chat with this user' }, { status: 403 });
      }
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
    const cacheKey = `chat:${sortedIds}:messages:limit:${limit}:${before || 'latest'}`;
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

    const query: any = {
      $or: [
        { sender: payload.userId, receiver: friendId },
        { sender: friendId, receiver: payload.userId },
      ],
      isDeleted: false,
      deletedBy: { $ne: payload.userId },
      $and: [
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } },
          ],
        },
        {
          $or: [
            { scheduledFor: { $exists: false } },
            { scheduledFor: null },
            { scheduledFor: { $lte: new Date() } },
          ],
        },
      ],
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
      })
      .lean();

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
      checklist,
      effect,
      transcription,
      topicId,
      expiresAt,
      isSilent = false,
      scheduledFor,
      encryptedPayload,
      iv,
      isEncrypted,
    } = await request.json();

    if (!receiverId || (!content && !imageUrl && !attachments?.length && !poll && !checklist && !forwardFrom && !encryptedPayload)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const isSelfSavedMessages = receiverId === payload.userId;
    const isFutureScheduled = scheduledFor && new Date(scheduledFor).getTime() > Date.now();

    // Check if either user is an admin
    const senderUserObj = await User.findById(payload.userId).select('role');
    const receiverUserObj = await User.findById(receiverId).select('role businessSettings fcmToken name avatar isPremium');
    const isAdminInvolved = senderUserObj?.role === 'admin' || receiverUserObj?.role === 'admin';

    if (!isAdminInvolved && !isSelfSavedMessages) {
      let friendship = await Friendship.findOne({
        $or: [
          { requester: payload.userId, recipient: receiverId },
          { requester: receiverId, recipient: payload.userId },
        ],
      });

      if (friendship?.status === 'blocked') {
        return NextResponse.json({ error: 'Cannot chat with this user' }, { status: 403 });
      }

      // Allow anybody to message anybody without being friends: auto-establish accepted conversation
      if (!friendship) {
        friendship = await Friendship.create({
          requester: payload.userId,
          recipient: receiverId,
          status: 'accepted',
        });
        await invalidateFriendsCache(payload.userId);
        await invalidateFriendsCache(receiverId);
      } else if (friendship.status !== 'accepted') {
        friendship.status = 'accepted';
        await friendship.save();
        await invalidateFriendsCache(payload.userId);
        await invalidateFriendsCache(receiverId);
      }
    }

    // Determine initial status based on online state
    let initialStatus: 'sent' | 'delivered' | 'read' = 'sent';
    if (!isFutureScheduled) {
      try {
        const { isUserOnline } = await import('@/lib/socket');
        if (isSelfSavedMessages) {
          initialStatus = 'read';
        } else if (isUserOnline(receiverId)) {
          initialStatus = 'delivered';
        } else if (!isSilent) {
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
                },
                android: {
                  priority: 'high',
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
      encryptedPayload: encryptedPayload || null,
      iv: iv || null,
      isEncrypted: Boolean(isEncrypted),
      isDelivered: false,
      status: isSelfSavedMessages ? 'read' : initialStatus,
      replyTo: replyTo || null,
      forwardFrom: forwardFrom || undefined,
      attachments: attachments || [],
      poll: poll || undefined,
      checklist: checklist || undefined,
      effect: effect || null,
      transcription: transcription || null,
      topicId: topicId || undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isSilent: Boolean(isSilent),
      scheduledFor: isFutureScheduled ? new Date(scheduledFor) : undefined,
    });

    const populated = await message.populate('sender', 'name username avatar');

    if (!isFutureScheduled) {
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

      // ── Automated Business Auto-Reply (Greeting & Away Messages) ──
      const isBusiness = receiverUserObj?.businessSettings?.isEnabled || receiverUserObj?.isPremium;
      if (isBusiness && !isSelfSavedMessages && receiverUserObj?.businessSettings) {
        try {
          const bs = receiverUserObj.businessSettings;
          let autoReplyText: string | null = null;

          // 1. Check Greeting Message
          if (bs.greetingMessage?.enabled && bs.greetingMessage?.text?.trim()) {
            const previousMsgCount = await Message.countDocuments({
              sender: payload.userId,
              receiver: receiverId,
              _id: { $ne: message._id },
            });
            if (previousMsgCount === 0) {
              autoReplyText = bs.greetingMessage.text.trim();
            }
          }

          // 2. Check Away Message (if no greeting was triggered or if outside business hours)
          if (!autoReplyText && bs.awayMessage?.enabled && bs.awayMessage?.text?.trim()) {
            let isAway = false;
            if (bs.awayMessage.schedule === 'always') {
              isAway = true;
            } else if (bs.openingHours?.enabled && Array.isArray(bs.openingHours.schedule)) {
              const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              const now = new Date();
              const currentDayName = daysOfWeek[now.getDay()];
              const todaySchedule = bs.openingHours.schedule.find((s: any) => s.day === currentDayName);

              if (todaySchedule) {
                if (todaySchedule.isClosed) {
                  isAway = true;
                } else if (!todaySchedule.is24Hours) {
                  const nowMinutes = now.getHours() * 60 + now.getMinutes();
                  const [openH, openM] = (todaySchedule.open || '09:00').split(':').map(Number);
                  const [closeH, closeM] = (todaySchedule.close || '18:00').split(':').map(Number);
                  const openMinutes = (openH || 0) * 60 + (openM || 0);
                  const closeMinutes = (closeH || 0) * 60 + (closeM || 0);
                  if (nowMinutes < openMinutes || nowMinutes > closeMinutes) {
                    isAway = true;
                  }
                }
              }
            }
            if (isAway) {
              autoReplyText = bs.awayMessage.text.trim();
            }
          }

          // If auto reply text is determined, create and emit automated message
          if (autoReplyText) {
            const autoMsg = await Message.create({
              sender: receiverId,
              receiver: payload.userId,
              content: autoReplyText,
              type: 'text',
              status: 'sent',
            });
            const populatedAuto = await autoMsg.populate('sender', 'name username avatar');
            const { getIO } = await import('@/lib/socket');
            const io = getIO();
            if (io) {
              const roomId = [payload.userId, receiverId].sort().join('_');
              io.to(roomId).emit('new_message', {
                message: populatedAuto.toObject(),
                from: receiverId,
              });
              io.to(`user:${payload.userId}`).emit('new_message', {
                message: populatedAuto.toObject(),
                from: receiverId,
              });
            }
          }
        } catch (autoErr) {
          console.error('[Business Auto-Reply Error]:', autoErr);
        }
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
