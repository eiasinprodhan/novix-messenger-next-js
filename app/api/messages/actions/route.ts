import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import { getUserFromRequest } from '@/lib/auth';

// POST: Add reaction
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { messageId, emoji } = await request.json();
    if (!messageId || !emoji) {
      return NextResponse.json({ error: 'messageId and emoji required' }, { status: 400 });
    }

    const message = await Message.findById(messageId);
    if (!message || message.isDeleted) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Remove previous reaction from this user
    message.reactions = message.reactions.filter((r: any) => r.user.toString() !== payload.userId);

    // Add new reaction
    message.reactions.push({ user: payload.userId as any, emoji });
    await message.save();

    // Emit real-time
    try {
      const { getIO } = await import('@/lib/socket');
      const io = getIO();
      if (io) {
        const roomId = message.group
          ? `group:${message.group.toString()}`
          : [message.sender.toString(), message.receiver?.toString() || ''].sort().join('_');
        io.to(roomId).emit('message_reaction', {
          messageId,
          reactions: message.reactions,
        });
      }
    } catch (_) {}

    return NextResponse.json({ success: true, reactions: message.reactions });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 });
  }
}

// DELETE reaction
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { messageId } = await request.json();
    const message = await Message.findById(messageId);
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    message.reactions = message.reactions.filter((r: any) => r.user.toString() !== payload.userId);
    await message.save();

    // Emit
    try {
      const { getIO } = await import('@/lib/socket');
      const io = getIO();
      if (io) {
        const roomId = message.group
          ? `group:${message.group.toString()}`
          : [message.sender.toString(), message.receiver?.toString() || ''].sort().join('_');
        io.to(roomId).emit('message_reaction', { messageId, reactions: message.reactions });
      }
    } catch (_) {}

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 });
  }
}
