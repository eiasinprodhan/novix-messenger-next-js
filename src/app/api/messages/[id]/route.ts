import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import { getUserFromRequest } from '@/lib/auth';
import Group from '@/models/Group';

// DELETE message (soft delete for everyone OR hide for me)
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

    const { searchParams } = new URL(request.url);
    const deleteFor = searchParams.get('deleteFor') || 'everyone';

    if (deleteFor === 'me') {
      // Any participant can delete for themselves
      const isParticipant = message.group
        ? true
        : [message.sender.toString(), message.receiver?.toString() || ''].includes(payload.userId);

      if (!isParticipant) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      if (!message.deletedBy.some((uid: any) => uid.toString() === payload.userId)) {
        message.deletedBy.push(payload.userId as any);
        await message.save();
      }

      return NextResponse.json({ success: true, deletedFor: 'me' });
    }

    // Delete for everyone: Sender can delete, or if in a group, group admin/creator can delete
    let canDelete = message.sender.toString() === payload.userId;
    if (!canDelete && message.group) {
      const groupObj = await Group.findById(message.group);
      if (groupObj) {
        const isCreator = (groupObj.createdBy?._id || groupObj.createdBy)?.toString() === payload.userId;
        const isAdmin = groupObj.members.some(
          (m: any) => (m.user?._id || m.user || m)?.toString() === payload.userId && m.role === 'admin'
        );
        canDelete = isCreator || isAdmin;
      }
    }

    if (!canDelete) {
      return NextResponse.json({ error: 'You are not authorized to delete this message for everyone' }, { status: 403 });
    }

    message.isDeleted = true;
    message.content = '';
    message.imageUrl = undefined;
    await message.save();

    // Invalidate chat cache
    try {
      const { invalidateChatCache } = await import('@/lib/redis');
      if (!message.group && message.receiver) {
        await invalidateChatCache(message.sender.toString(), message.receiver.toString());
      }
    } catch (_) {}

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

    return NextResponse.json({ success: true, deletedFor: 'everyone' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}

// PATCH: Edit message OR Pin / Unpin message
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action, content } = body;

    const message = await Message.findById(id).populate('sender', 'name username avatar');
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    // Handle Edit Message
    if (action === 'edit') {
      if (message.sender._id.toString() !== payload.userId && message.sender.toString() !== payload.userId) {
        return NextResponse.json({ error: 'You can only edit your own messages' }, { status: 403 });
      }
      if (message.isDeleted) {
        return NextResponse.json({ error: 'Cannot edit deleted message' }, { status: 400 });
      }
      if (!content || typeof content !== 'string' || !content.trim()) {
        return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 });
      }

      message.content = content.trim();
      message.isEdited = true;
      message.editedAt = new Date();
      await message.save();

      // Broadcast edit
      try {
        const { getIO } = await import('@/lib/socket');
        const io = getIO();
        if (io) {
          const roomId = message.group
            ? `group:${message.group.toString()}`
            : [message.sender._id?.toString() || message.sender.toString(), message.receiver?.toString() || ''].sort().join('_');
          io.to(roomId).emit('message_edited', {
            messageId: id,
            content: message.content,
            isEdited: true,
            editedAt: message.editedAt,
            groupId: message.group ? message.group.toString() : null,
          });
        }
      } catch (_) {}

      return NextResponse.json({ success: true, message });
    }

    // Handle Pin / Unpin Message
    let isParticipant = false;
    if (message.group) {
      const groupObj = await Group.findById(message.group);
      isParticipant = groupObj ? groupObj.members.some((m: any) => (m.user?._id || m.user || m)?.toString() === payload.userId) : false;
    } else {
      const senderId = message.sender._id?.toString() || message.sender.toString();
      const receiverId = message.receiver?.toString() || '';
      isParticipant = [senderId, receiverId].includes(payload.userId);
    }
    if (!isParticipant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    message.isPinned = action === 'pin';
    await message.save();

    let updatedPinnedMessage: any = null;
    if (message.group) {
      if (action === 'pin') {
        await Group.findByIdAndUpdate(message.group, { pinnedMessage: message._id });
        updatedPinnedMessage = message.toObject();
      } else {
        await Group.findByIdAndUpdate(message.group, { $unset: { pinnedMessage: 1 } });
        updatedPinnedMessage = null;
      }
    }

    // Broadcast
    try {
      const { getIO } = await import('@/lib/socket');
      const io = getIO();
      if (io) {
        const senderId = message.sender._id?.toString() || message.sender.toString();
        const receiverId = message.receiver?.toString() || '';
        const roomId = message.group
          ? `group:${message.group.toString()}`
          : [senderId, receiverId].sort().join('_');
        io.to(roomId).emit('message_pinned', {
          messageId: id,
          isPinned: message.isPinned,
          groupId: message.group ? message.group.toString() : null,
          pinnedMessage: updatedPinnedMessage,
        });
      }
    } catch (_) {}

    return NextResponse.json({ success: true, isPinned: message.isPinned, pinnedMessage: updatedPinnedMessage });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}
