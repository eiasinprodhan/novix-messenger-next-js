import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action, chatId, durationSeconds } = body;

    if (!chatId || !action) {
      return NextResponse.json({ error: 'chatId and action are required' }, { status: 400 });
    }

    const user = await User.findById(payload.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    user.archivedChats = user.archivedChats || [];
    user.mutedChats = user.mutedChats || [];
    user.unreadChats = user.unreadChats || [];

    switch (action) {
      case 'archive':
        if (!user.archivedChats.includes(chatId)) {
          user.archivedChats.push(chatId);
        }
        break;

      case 'unarchive':
        user.archivedChats = user.archivedChats.filter((id) => id !== chatId);
        break;

      case 'mute': {
        const mutedUntil = durationSeconds ? new Date(Date.now() + durationSeconds * 1000) : undefined;
        user.mutedChats = user.mutedChats.filter((m) => m.chatId !== chatId);
        user.mutedChats.push({ chatId, mutedUntil });
        break;
      }

      case 'unmute':
        user.mutedChats = user.mutedChats.filter((m) => m.chatId !== chatId);
        break;

      case 'mark_unread':
        if (!user.unreadChats.includes(chatId)) {
          user.unreadChats.push(chatId);
        }
        break;

      case 'mark_read':
        user.unreadChats = user.unreadChats.filter((id) => id !== chatId);
        break;

      default:
        return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
    }

    await user.save();

    // Broadcast update to user's devices
    try {
      const { getIO } = await import('@/lib/socket');
      const io = getIO();
      if (io) {
        io.to(`user:${payload.userId}`).emit('chat_state_changed', {
          chatId,
          action,
          archivedChats: user.archivedChats,
          mutedChats: user.mutedChats,
          unreadChats: user.unreadChats,
        });
      }
    } catch (_) {}

    return NextResponse.json({
      success: true,
      archivedChats: user.archivedChats,
      mutedChats: user.mutedChats,
      unreadChats: user.unreadChats,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to manage chat' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await User.findById(payload.userId).select('archivedChats mutedChats unreadChats');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      archivedChats: user.archivedChats || [],
      mutedChats: user.mutedChats || [],
      unreadChats: user.unreadChats || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to get chat states' }, { status: 500 });
  }
}
