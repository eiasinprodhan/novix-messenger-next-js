import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { invalidateFriendsCache, invalidateChatCache } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { friendId, deleteForEveryone = false } = await request.json();
    if (!friendId) {
      return NextResponse.json({ error: 'friendId is required' }, { status: 400 });
    }

    // If checked, mark all sent messages from the current user as globally deleted
    if (deleteForEveryone) {
      await Message.updateMany(
        {
          sender: payload.userId,
          receiver: friendId,
        },
        { $set: { isDeleted: true } }
      );
    }

    // Add current user's ID to the deletedBy array of all messages in this conversation
    await Message.updateMany(
      {
        $or: [
          { sender: payload.userId, receiver: friendId },
          { sender: friendId, receiver: payload.userId },
        ],
      },
      { $addToSet: { deletedBy: payload.userId } }
    );

    // Also hide this chat from the current user's chat list
    await User.findByIdAndUpdate(
      payload.userId,
      { $addToSet: { hiddenChats: friendId } }
    );

    // Invalidate Redis/memory chat cache so future GET requests do not return stale cached messages
    await invalidateFriendsCache(payload.userId);
    await invalidateFriendsCache(friendId);
    await invalidateChatCache(payload.userId, friendId);

    // Broadcast chat_cleared event via socket
    try {
      const { getIO } = await import('@/lib/socket');
      const io = getIO();
      if (io) {
        const roomId = [payload.userId, friendId].sort().join('_');
        io.to(roomId).emit('chat_cleared', {
          clearedBy: payload.userId,
          friendId,
          deleteForEveryone,
        });
      }
    } catch (_) {}

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Messages clear error:', error);
    return NextResponse.json({ error: 'Failed to clear chat' }, { status: 500 });
  }
}
