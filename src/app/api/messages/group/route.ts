import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import Group from '@/models/Group';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { messaging, formatNotificationPreview } from '@/lib/firebase-admin';
import { isUserOnline } from '@/lib/socket';

// GET group messages
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before');
    const topicId = searchParams.get('topicId');

    if (!groupId) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
    }

    // Verify membership safely
    const group = await Group.findById(groupId);
    if (!group || !group.members.some((m: any) => (m.user?._id || m.user || m)?.toString() === payload.userId)) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
    }

    // Mark messages as read by this user
    await Message.updateMany(
      {
        group: groupId,
        sender: { $ne: payload.userId },
        readBy: { $ne: payload.userId }
      },
      {
        $addToSet: { readBy: payload.userId }
      }
    );

    // Emit read event to group room
    try {
      const { getIO } = await import('@/lib/socket');
      const io = getIO();
      if (io) {
        io.to(`group:${groupId}`).emit('group_messages_read', {
          groupId,
          readerId: payload.userId,
        });
      }
    } catch (_) {}

    const query: any = {
      group: groupId,
      isDeleted: false,
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

    if (topicId) {
      query.topicId = topicId;
    }

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
        populate: { path: 'sender', select: 'name username' }
      });

    return NextResponse.json({ messages: messages.reverse() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch group messages' }, { status: 500 });
  }
}

// POST send message to group
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      groupId,
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
    } = await request.json();

    const isFutureScheduled = scheduledFor && new Date(scheduledFor).getTime() > Date.now();

    if (!groupId || (!content && !imageUrl && !attachments?.length && !poll && !checklist && !forwardFrom)) {
      return NextResponse.json({ error: 'groupId and content/attachments/poll required' }, { status: 400 });
    }

    // Verify membership safely
    const group = await Group.findById(groupId);
    if (!group || !group.members.some((m: any) => (m.user?._id || m.user || m)?.toString() === payload.userId)) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
    }

    const isCreator = (group.createdBy?._id || group.createdBy)?.toString() === payload.userId;
    const memberEntry = group.members.find((m: any) => (m.user?._id || m.user || m)?.toString() === payload.userId);
    const isAdmin = isCreator || memberEntry?.role === 'admin';

    // 1. Enforce group permissions for non-admins
    if (!isAdmin && group.permissions) {
      if (group.permissions.canSendMessages === false && type === 'text') {
        return NextResponse.json({ error: 'Sending messages is restricted in this group' }, { status: 403 });
      }
      if (group.permissions.canSendMedia === false && (['image', 'video', 'document', 'audio', 'voice'].includes(type) || attachments?.length || imageUrl)) {
        return NextResponse.json({ error: 'Sending media is restricted in this group' }, { status: 403 });
      }
      if (group.permissions.canSendPolls === false && (type === 'poll' || poll)) {
        return NextResponse.json({ error: 'Sending polls is restricted in this group' }, { status: 403 });
      }
      if (group.permissions.canEmbedLinks === false && content && /https?:\/\//i.test(content)) {
        return NextResponse.json({ error: 'Embedding links is restricted in this group' }, { status: 403 });
      }
    }

    // 2. Enforce Slow Mode
    if (!isAdmin && group.slowMode && group.slowMode > 0) {
      const lastMsg = await Message.findOne({ group: groupId, sender: payload.userId, isDeleted: false }).sort({ createdAt: -1 });
      if (lastMsg) {
        const elapsedSec = (Date.now() - new Date(lastMsg.createdAt).getTime()) / 1000;
        if (elapsedSec < group.slowMode) {
          const remaining = Math.ceil(group.slowMode - elapsedSec);
          return NextResponse.json({ error: `Slow mode is active. Please wait ${remaining}s before sending another message.`, retryAfter: remaining }, { status: 429 });
        }
      }
    }

    // 3. Compute Auto-Delete TTL if configured
    let computedExpiresAt = expiresAt ? new Date(expiresAt) : undefined;
    if (!computedExpiresAt && group.autoDeleteTimer && group.autoDeleteTimer > 0) {
      computedExpiresAt = new Date(Date.now() + group.autoDeleteTimer * 1000);
    }

    const message = await Message.create({
      sender: payload.userId,
      group: groupId,
      content: content?.trim() || (content || ''),
      type,
      imageUrl: imageUrl || null,
      status: 'sent',
      replyTo: replyTo || null,
      forwardFrom: forwardFrom || undefined,
      attachments: attachments || [],
      poll: poll || undefined,
      checklist: checklist || undefined,
      effect: effect || null,
      transcription: transcription || null,
      topicId: topicId || undefined,
      expiresAt: computedExpiresAt,
      isSilent: Boolean(isSilent),
      scheduledFor: isFutureScheduled ? new Date(scheduledFor) : undefined,
      readBy: [payload.userId], // sender has read their own message
    });

    // Populate sender and replyTo
    const populated = await message.populate([
      { path: 'sender', select: 'name username avatar' },
      {
        path: 'replyTo',
        select: 'content sender type imageUrl',
        populate: { path: 'sender', select: 'name username' }
      }
    ]);

    // Bump group updatedAt so it sorts to top of chat lists
    await Group.findByIdAndUpdate(groupId, { updatedAt: new Date() });

    // Emit real-time to group room AND to each member's personal user room
    if (!isFutureScheduled) {
      try {
        const { getIO } = await import('@/lib/socket');
        const io = getIO();
        if (io) {
          const msgObj = populated.toObject();
          io.to(`group:${groupId}`).emit('new_group_message', {
            message: msgObj,
            groupId,
          });

          // Also emit to all member user rooms so home screen and notifications update in real-time
          for (const m of group.members) {
            const mId = (m.user?._id || m.user || m)?.toString();
            if (mId && mId !== payload.userId) {
              io.to(`user:${mId}`).emit('new_group_message', {
                message: msgObj,
                groupId,
              });
            }
          }
        }
      } catch (_) {}

      // Send FCM push to offline group members
      if (messaging) {
        try {
          const senderUser = (populated as any).sender as { _id: any; name?: string; avatar?: string } | null;
          const senderName = senderUser?.name || 'Someone';
          const senderAvatar = senderUser?.avatar || '';
          const notifTitle = group.name as string;
          const previewText = formatNotificationPreview(content, type);
          const notifBody = `${senderName}: ${previewText}`;

          const memberIds: string[] = group.members
            .map((m: any) => (m.user?._id || m.user || m)?.toString())
            .filter((id: string) => id && id !== payload.userId);

          const offlineMembers = memberIds.filter((id) => !isUserOnline(id));

          if (offlineMembers.length > 0) {
            const memberUsers = await User.find(
              { _id: { $in: offlineMembers }, fcmToken: { $exists: true, $ne: '' } },
              'fcmToken'
            ).lean();

            await Promise.allSettled(
              memberUsers.map((member: any) =>
                messaging!.send({
                  token: member.fcmToken,
                  notification: { title: notifTitle, body: notifBody },
                  data: {
                    type: 'group_message',
                    messageType: type || 'text',
                    groupId,
                    senderId: payload.userId,
                    senderName,
                    senderAvatar,
                    body: notifBody,
                  },
                  android: {
                    priority: 'high',
                    notification: {
                      channelId: 'group_message_channel_id',
                      icon: '@mipmap/ic_launcher',
                    },
                  },
                })
              )
            );
          }
        } catch (fcmErr) {
          console.error('[FCM] Group message push error:', fcmErr);
        }
      }
    }

    return NextResponse.json({ success: true, message: populated }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send group message' }, { status: 500 });
  }
}
