import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import Group from '@/models/Group';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { messaging } from '@/lib/firebase-admin';
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

    if (!groupId) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
    }

    // Verify membership
    const group = await Group.findById(groupId);
    if (!group || !group.members.some((m: any) => m.user.toString() === payload.userId)) {
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

    const messages = await Message.find({
      group: groupId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'name username avatar')
      .populate({
        path: 'replyTo',
        select: 'content sender type imageUrl',
        populate: { path: 'sender', select: 'name' }
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

    const { groupId, content, type = 'text', imageUrl, replyTo } = await request.json();

    if (!groupId || (!content && !imageUrl)) {
      return NextResponse.json({ error: 'groupId and content/image required' }, { status: 400 });
    }

    // Verify membership
    const group = await Group.findById(groupId);
    if (!group || !group.members.some((m: any) => m.user.toString() === payload.userId)) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
    }

    const message = await Message.create({
      sender: payload.userId,
      group: groupId,
      content: content || '',
      type,
      imageUrl: imageUrl || null,
      status: 'sent',
      replyTo: replyTo || null,
      readBy: [payload.userId], // sender has read their own message
    });

    const populated = await message.populate('sender', 'name username avatar');

    // Emit real-time to group room
    try {
      const { getIO } = await import('@/lib/socket');
      const io = getIO();
      if (io) {
        io.to(`group:${groupId}`).emit('new_group_message', {
          message: populated.toObject(),
          groupId,
        });
      }
    } catch (_) {}

    // Send FCM push to offline group members
    if (messaging) {
      try {
        const senderUser = (populated as any).sender as { _id: any; name?: string; avatar?: string } | null;
        const senderName = senderUser?.name || 'Someone';
        const senderAvatar = senderUser?.avatar || '';
        const notifTitle = group.name as string;
        const notifBody = type === 'image'
          ? `${senderName}: 📷 Image`
          : type === 'audio'
          ? `${senderName}: 🎵 Voice message`
          : `${senderName}: ${content || ''}`;

        const memberIds: string[] = group.members
          .map((m: any) => m.user?.toString() ?? m.toString())
          .filter((id: string) => id !== payload.userId);

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
                  groupId,
                  senderId: payload.userId,
                  senderName,
                  senderAvatar,
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

    return NextResponse.json({ success: true, message: populated }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send group message' }, { status: 500 });
  }
}
