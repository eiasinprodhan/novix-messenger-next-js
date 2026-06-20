import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import { getUserFromRequest } from '@/lib/auth';
import Group from '@/models/Group';

// DELETE message (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const message = await Message.findById(id);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Only sender can delete
    if (message.sender.toString() !== payload.userId) {
      return NextResponse.json({ error: 'You can only delete your own messages' }, { status: 403 });
    }

    message.isDeleted = true;
    message.content = '';
    message.imageUrl = undefined;
    await message.save();

    // Broadcast deletion
    try {
      const { getIO } = await import('@/lib/socket');
      const io = getIO();
      if (io) {
        const roomId = message.group
          ? `group:${message.group.toString()}`
          : [message.sender.toString(), message.receiver?.toString() || ''].sort().join('_');
        io.to(roomId).emit('message_deleted', { messageId: id });
      }
    } catch (_) {}

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}

// PATCH: Pin / Unpin message
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action } = await request.json(); // 'pin' or 'unpin'

    const message = await Message.findById(id);
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    // Only participants can pin
    let isParticipant = false;
    if (message.group) {
      const groupObj = await Group.findById(message.group);
      isParticipant = groupObj ? groupObj.members.some((m: any) => m.user.toString() === payload.userId) : false;
    } else {
      isParticipant = [message.sender.toString(), message.receiver?.toString() || ''].includes(payload.userId);
    }
    if (!isParticipant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    message.isPinned = action === 'pin';
    await message.save();

    // Broadcast
    try {
      const { getIO } = await import('@/lib/socket');
      const io = getIO();
      if (io) {
        const roomId = message.group
          ? `group:${message.group.toString()}`
          : [message.sender.toString(), message.receiver?.toString() || ''].sort().join('_');
        io.to(roomId).emit('message_pinned', {
          messageId: id,
          isPinned: message.isPinned,
        });
      }
    } catch (_) {}

    return NextResponse.json({ success: true, isPinned: message.isPinned });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to pin/unpin message' }, { status: 500 });
  }
}
