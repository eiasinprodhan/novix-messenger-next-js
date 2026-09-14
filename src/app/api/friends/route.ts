import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Friendship from '@/models/Friendship';
import User from '@/models/User';
import Message from '@/models/Message';
import { getUserFromRequest } from '@/lib/auth';
import { getCache, setCache, invalidateFriendsCache } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'friends';
    const includeHidden = searchParams.get('includeHidden') === 'true';

    const cacheKey = `user:${payload.userId}:friends:${type}:${includeHidden}`;
    const cachedData = await getCache<{ friendships: any }>(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    let query: any = {};

    if (type === 'friends') {
      query = {
        $or: [
          { requester: payload.userId, status: 'accepted' },
          { recipient: payload.userId, status: 'accepted' },
        ],
      };
    } else if (type === 'pending') {
      query = { recipient: payload.userId, status: 'pending' };
    } else if (type === 'sent') {
      query = { requester: payload.userId, status: 'pending' };
    } else if (type === 'blocked') {
      query = { requester: payload.userId, status: 'blocked' };
    }

    let friendships = await Friendship.find(query)
      .populate('requester', 'name username avatar isOnline lastSeen role')
      .populate('recipient', 'name username avatar isOnline lastSeen role')
      .sort({ createdAt: -1 });

    // Filter out friendships where either user has role 'admin'
    const results = await Promise.all(friendships.map(async (f: any) => {
      if (!f.requester || !f.recipient) return null;
      const isRequester = f.requester._id.toString() === payload.userId;
      const otherUser = isRequester ? f.recipient : f.requester;
      const isAdminChat = otherUser.role === 'admin';

      // Get last message for this friendship
      const lastMessage = await Message.findOne({
        $or: [
          { sender: payload.userId, receiver: otherUser._id },
          { sender: otherUser._id, receiver: payload.userId },
        ],
        deletedBy: { $ne: payload.userId },
      })
        .sort({ createdAt: -1 })
        .select('content createdAt sender type imageUrl status');

      // For admin chats: allow connection even when messages are stored on-device

      // Get unread message count (sent by otherUser to current user and status is not read)
      const unreadCount = await Message.countDocuments({
        sender: otherUser._id,
        receiver: payload.userId,
        status: { $ne: 'read' },
        deletedBy: { $ne: payload.userId },
      });

      return {
        _id: f._id,
        status: f.status,
        createdAt: f.createdAt,
        isAdminChat,
        otherUser: {
          _id: otherUser._id,
          name: otherUser.name,
          username: otherUser.username,
          avatar: otherUser.avatar,
          country: otherUser.country,
          isOnline: otherUser.isOnline,
          lastSeen: otherUser.lastSeen,
          role: otherUser.role,
        },
        lastMessage: lastMessage
          ? {
              content: lastMessage.content || (lastMessage.type === 'image' ? '[Photo]' : ''),
              createdAt: lastMessage.createdAt,
              type: lastMessage.type,
              status: lastMessage.status,
              senderId: lastMessage.sender.toString(),
            }
          : null,
        unreadCount,
        isRequester,
      };
    }));

    // Remove null entries (admin chats with no messages, or missing users)
    const validResults = results.filter((r) => r !== null);

    let finalResponse;
    // For 'friends' type, filter out chats the user has hidden (deleted from their view)
    if (type === 'friends' && !includeHidden) {
      const currentUser = await User.findById(payload.userId).select('hiddenChats');
      const hiddenIds = (currentUser?.hiddenChats ?? []).map((id: any) => id.toString());
      const filtered = validResults.filter((r: any) => !hiddenIds.includes(r.otherUser._id.toString()));
      finalResponse = { friendships: filtered };
    } else {
      finalResponse = { friendships: validResults };
    }

    await setCache(cacheKey, finalResponse, 300);
    return NextResponse.json(finalResponse);
  } catch (error) {
    console.error('Friends GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const friendshipId = searchParams.get('friendshipId');
    const otherUserId = searchParams.get('friendId');

    let friendship;

    if (friendshipId) {
      friendship = await Friendship.findById(friendshipId);
    } else if (otherUserId) {
      friendship = await Friendship.findOne({
        $or: [
          { requester: payload.userId, recipient: otherUserId },
          { requester: otherUserId, recipient: payload.userId },
        ],
      });
    }

    if (!friendship) {
      return NextResponse.json({ error: 'Friendship not found' }, { status: 404 });
    }

    const reqId = (friendship.requester?._id || friendship.requester?.id || friendship.requester)?.toString();
    const recId = (friendship.recipient?._id || friendship.recipient?.id || friendship.recipient)?.toString();

    // Verify current user is part of this friendship
    if (reqId !== payload.userId && recId !== payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await Friendship.findByIdAndDelete(friendship.id || friendship._id);

    if (reqId) await invalidateFriendsCache(reqId);
    if (recId) await invalidateFriendsCache(recId);

    try {
      const { getIO } = await import('@/lib/socket');
      const io = getIO();
      if (io) {
        if (reqId) io.to(`user:${reqId}`).emit('friend_request_declined', { friendshipId: friendship.id || friendship._id });
        if (recId) io.to(`user:${recId}`).emit('friend_request_declined', { friendshipId: friendship.id || friendship._id });
      }
    } catch (_) {}

    return NextResponse.json({ success: true, message: 'Friend request/friendship removed successfully' });
  } catch (error) {
    console.error('Friends DELETE error:', error);
    return NextResponse.json({ error: 'Failed to remove friendship' }, { status: 500 });
  }
}

