import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
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

    const userObjId = new mongoose.Types.ObjectId(payload.userId);

    // Parallelize friendship query, unread message counts, and hidden chats lookup
    const [friendships, unreadCountsAgg, currentUser] = await Promise.all([
      Friendship.find(query)
        .populate('requester', 'name username avatar country isOnline lastSeen role')
        .populate('recipient', 'name username avatar country isOnline lastSeen role')
        .sort({ createdAt: -1 })
        .lean(),
      Message.aggregate([
        {
          $match: {
            receiver: userObjId,
            status: { $ne: 'read' },
            deletedBy: { $ne: userObjId },
          },
        },
        {
          $group: {
            _id: '$sender',
            count: { $sum: 1 },
          },
        },
      ]),
      (type === 'friends' && !includeHidden)
        ? User.findById(payload.userId).select('hiddenChats').lean()
        : Promise.resolve(null),
    ]);

    const unreadMap = new Map<string, number>();
    for (const row of unreadCountsAgg) {
      if (row._id) {
        unreadMap.set(row._id.toString(), row.count);
      }
    }

    // Collect friend user IDs to batch fetch their last messages in a single query
    const otherUserObjIds: mongoose.Types.ObjectId[] = [];
    for (const f of friendships) {
      if (!f.requester || !f.recipient) continue;
      const isRequester = (f.requester as any)._id.toString() === payload.userId;
      const otherUser = isRequester ? (f.recipient as any) : (f.requester as any);
      if (otherUser && otherUser._id) {
        otherUserObjIds.push(new mongoose.Types.ObjectId(otherUser._id.toString()));
      }
    }

    const lastMessagesMap = new Map<string, any>();
    if (otherUserObjIds.length > 0) {
      const lastMessagesAgg = await Message.aggregate([
        {
          $match: {
            deletedBy: { $ne: userObjId },
            $or: [
              { sender: userObjId, receiver: { $in: otherUserObjIds } },
              { receiver: userObjId, sender: { $in: otherUserObjIds } },
            ],
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ['$sender', userObjId] },
                '$receiver',
                '$sender',
              ],
            },
            content: { $first: '$content' },
            createdAt: { $first: '$createdAt' },
            sender: { $first: '$sender' },
            type: { $first: '$type' },
            imageUrl: { $first: '$imageUrl' },
            status: { $first: '$status' },
          },
        },
      ]);

      for (const row of lastMessagesAgg) {
        if (row._id) {
          lastMessagesMap.set(row._id.toString(), row);
        }
      }
    }

    const hiddenIds = new Set(
      ((currentUser as any)?.hiddenChats ?? []).map((id: any) => id.toString())
    );

    const validResults: any[] = [];
    for (const f of friendships) {
      if (!f.requester || !f.recipient) continue;
      const isRequester = (f.requester as any)._id.toString() === payload.userId;
      const otherUser = isRequester ? (f.recipient as any) : (f.requester as any);
      if (!otherUser || !otherUser._id) continue;

      const otherUserIdStr = otherUser._id.toString();

      // For 'friends' type, skip chats the user has hidden
      if (type === 'friends' && !includeHidden && hiddenIds.has(otherUserIdStr)) {
        continue;
      }

      const isAdminChat = otherUser.role === 'admin';
      const lastMsg = lastMessagesMap.get(otherUserIdStr);

      // For admin chats: only include if there's at least one message
      if (isAdminChat && !lastMsg) continue;

      const unreadCount = unreadMap.get(otherUserIdStr) || 0;

      validResults.push({
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
        lastMessage: lastMsg
          ? {
              content: lastMsg.content || (
                lastMsg.type === 'image' ? '[Photo]' :
                (lastMsg.type === 'audio' || lastMsg.type === 'voice') ? '[Voice message]' :
                lastMsg.type === 'video' ? '[Video]' :
                lastMsg.type === 'document' ? '[Document]' : ''
              ),
              createdAt: lastMsg.createdAt,
              type: lastMsg.type,
              status: lastMsg.status,
              senderId: lastMsg.sender ? lastMsg.sender.toString() : '',
            }
          : null,
        unreadCount,
        isRequester,
      });
    }

    const finalResponse = { friendships: validResults };

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

    // Verify current user is part of this friendship
    if (
      friendship.requester.toString() !== payload.userId &&
      friendship.recipient.toString() !== payload.userId
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await Friendship.findByIdAndDelete(friendship._id);

    const firstUser = friendship.requester.toString();
    const secondUser = friendship.recipient.toString();
    await invalidateFriendsCache(firstUser);
    await invalidateFriendsCache(secondUser);

    return NextResponse.json({ success: true, message: 'Friend request/friendship removed successfully' });
  } catch (error) {
    console.error('Friends DELETE error:', error);
    return NextResponse.json({ error: 'Failed to remove friendship' }, { status: 500 });
  }
}

