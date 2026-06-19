import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import Friendship from '@/models/Friendship';
import { getUserFromRequest } from '@/lib/auth';

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
    await Message.updateMany(
      { sender: friendId, receiver: payload.userId, status: { $ne: 'read' } },
      { status: 'read' }
    );

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
    })
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
    let initialStatus = 'sent';
    try {
      const { isUserOnline } = await import('@/lib/socket');
      if (isUserOnline(receiverId)) {
        initialStatus = 'delivered';
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
