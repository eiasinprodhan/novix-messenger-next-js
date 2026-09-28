import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import { getUserFromRequest } from '@/lib/auth';
import { invalidateChatCache } from '@/lib/redis';

/**
 * WhatsApp-style Message Delivery Acknowledgment & Server Purge
 * Once messages are securely received & decrypted on the user's phone,
 * this endpoint immediately deletes them from the server database permanently.
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messageIds } = body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Find messages to identify senders so we can notify them of delivery receipt
    const messages = await Message.find({
      _id: { $in: messageIds },
      receiver: payload.userId,
    }).select('_id sender receiver');

    if (messages.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Notify senders via socket that messages were delivered
    try {
      const { getIO } = await import('@/lib/socket');
      const io = getIO();
      if (io) {
        for (const msg of messages) {
          const roomId = [payload.userId, msg.sender.toString()].sort().join('_');
          io.to(roomId).emit('message_status', {
            messageId: msg._id.toString(),
            status: 'delivered',
            deliveredAt: new Date().toISOString(),
          });
          io.to(`user:${msg.sender.toString()}`).emit('message_status', {
            messageId: msg._id.toString(),
            status: 'delivered',
            deliveredAt: new Date().toISOString(),
          });
        }
      }
    } catch (_) {}

    // WhatsApp-style: Immediately and permanently DELETE delivered messages from server DB!
    const deleteResult = await Message.deleteMany({
      _id: { $in: messageIds },
      receiver: payload.userId,
    });

    // Invalidate chat caches
    const senderIds = Array.from(new Set(messages.map((m) => m.sender.toString())));
    for (const senderId of senderIds) {
      await invalidateChatCache(payload.userId, senderId);
    }

    return NextResponse.json({
      success: true,
      purgedCount: deleteResult.deletedCount,
      message: 'Delivered messages permanently purged from server',
    });
  } catch (error) {
    console.error('Error acknowledging & purging messages:', error);
    return NextResponse.json(
      { error: 'Failed to process message delivery acknowledgment' },
      { status: 500 }
    );
  }
}
