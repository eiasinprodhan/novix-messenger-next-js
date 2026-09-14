import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import { getUserFromRequest } from '@/lib/auth';
import { invalidateChatCache, invalidateFriendsCache } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const messageIds: string[] = body.messageIds || (body.messageId ? [body.messageId] : []);

    if (!messageIds || messageIds.length === 0) {
      return NextResponse.json({ error: 'messageId or messageIds required' }, { status: 400 });
    }

    // Find messages where the current user is the receiver or group member
    const msgs = await Message.find({
      _id: { $in: messageIds },
      $or: [
        { receiver: payload.userId },
        { group: { $exists: true } }
      ]
    }).select('_id sender receiver');

    if (msgs.length === 0) {
      return NextResponse.json({ success: true, deletedCount: 0 });
    }

    const idsToDelete = msgs.map((m: any) => m._id);

    // Group senders to notify them that their messages were delivered
    const senderSet = new Set<string>();
    for (const m of msgs) {
      if (m.sender) senderSet.add(m.sender.toString());
    }

    // Permanently delete delivered messages from SQLite immediately! (Zero server message storage)
    await Message.deleteMany({ _id: { $in: idsToDelete } });

    // Invalidate Redis caches
    for (const senderId of senderSet) {
      await invalidateChatCache(senderId, payload.userId);
      await invalidateFriendsCache(senderId);
    }
    await invalidateFriendsCache(payload.userId);

    // Notify senders via Socket.IO
    try {
      const { getIO } = await import('@/lib/socket');
      const io = getIO();
      if (io) {
        for (const senderId of senderSet) {
          io.to(`user:${senderId}`).emit('messages_delivered', {
            receiverId: payload.userId,
            deliveredMessageIds: idsToDelete.map((id: any) => id.toString()),
          });
        }
      }
    } catch (_) {}

    return NextResponse.json({
      success: true,
      deletedCount: idsToDelete.length,
      purgedMessageIds: idsToDelete,
    });
  } catch (error) {
    console.error('Messages ACK error:', error);
    return NextResponse.json({ error: 'Failed to process message ack' }, { status: 500 });
  }
}
