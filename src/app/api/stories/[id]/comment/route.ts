import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Story from '@/models/Story';
import Message from '@/models/Message';
import Friendship from '@/models/Friendship';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { messaging } from '@/lib/firebase-admin';
import { invalidateFriendsCache, invalidateChatCache } from '@/lib/redis';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { comment } = await request.json();
    if (!comment) {
      return NextResponse.json({ error: 'Missing comment text' }, { status: 400 });
    }

    const story = await Story.findById(id);
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    const receiverId = story.user.toString();

    // Verify friendship (commenting is allowed if they are friends)
    const friendship = await Friendship.findOne({
      $or: [
        { requester: payload.userId, recipient: receiverId, status: 'accepted' },
        { requester: receiverId, recipient: payload.userId, status: 'accepted' },
      ],
    });

    if (!friendship && payload.userId !== receiverId) {
      return NextResponse.json({ error: 'You can only comment on friends\' stories' }, { status: 403 });
    }

    const messageContent = `💬 [Story Comment]: "${comment}"`;

    let initialStatus: 'sent' | 'delivered' | 'read' = 'sent';
    try {
      const { isUserOnline } = await import('@/lib/socket');
      if (isUserOnline(receiverId)) {
        initialStatus = 'delivered';
      } else {
        const receiverUser = await User.findById(receiverId);
        if (receiverUser?.fcmToken && messaging) {
          const senderUser = await User.findById(payload.userId);
          try {
            await messaging.send({
              token: receiverUser.fcmToken,
              notification: {
                title: `${senderUser?.name || 'Friend'} commented on your story`,
                body: comment,
              },
              data: {
                type: 'new_message',
                senderId: payload.userId,
              },
            });
          } catch (fcmError) {}
        }
      }
    } catch (e) {}

    const message = await Message.create({
      sender: payload.userId,
      receiver: receiverId,
      content: messageContent,
      type: 'image',
      imageUrl: story.imageUrl,
      status: initialStatus,
    });

    const populatedMessage = await message.populate('sender', 'name username avatar');

    await User.findByIdAndUpdate(payload.userId, { $pull: { hiddenChats: receiverId } });
    await User.findByIdAndUpdate(receiverId, { $pull: { hiddenChats: payload.userId } });

    await invalidateFriendsCache(payload.userId);
    await invalidateFriendsCache(receiverId);
    await invalidateChatCache(payload.userId, receiverId);

    try {
      const { getIO } = await import('@/lib/socket');
      const io = getIO();
      if (io) {
        const roomId = [payload.userId, receiverId].sort().join('_');
        io.to(roomId).emit('new_message', {
          message: populatedMessage.toObject(),
          from: payload.userId,
        });
        io.to(`user:${receiverId}`).emit('new_message', {
          message: populatedMessage.toObject(),
          from: payload.userId,
        });
      }
    } catch (e) {}

    return NextResponse.json({ success: true, message: populatedMessage });
  } catch (error) {
    console.error('Story comment error:', error);
    return NextResponse.json({ error: 'Failed to comment on story' }, { status: 500 });
  }
}
