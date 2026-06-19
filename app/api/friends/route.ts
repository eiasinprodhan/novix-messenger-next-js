import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Friendship from '@/models/Friendship';
import User from '@/models/User';
import Message from '@/models/Message';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'friends';

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
    }

    let friendships = await Friendship.find(query)
      .populate('requester', 'name username avatar isOnline lastSeen')
      .populate('recipient', 'name username avatar isOnline lastSeen')
      .sort({ createdAt: -1 });

    const results = await Promise.all(friendships.map(async (f: any) => {
      const isRequester = f.requester._id.toString() === payload.userId;
      const otherUser = isRequester ? f.recipient : f.requester;

      // Get last message for this friendship
      const lastMessage = await Message.findOne({
        $or: [
          { sender: payload.userId, receiver: otherUser._id },
          { sender: otherUser._id, receiver: payload.userId },
        ],
      })
        .sort({ createdAt: -1 })
        .select('content createdAt sender type imageUrl status');

      // Get unread message count (sent by otherUser to current user and status is not read)
      const unreadCount = await Message.countDocuments({
        sender: otherUser._id,
        receiver: payload.userId,
        status: { $ne: 'read' },
      });

      return {
        _id: f._id,
        status: f.status,
        createdAt: f.createdAt,
        otherUser: {
          _id: otherUser._id,
          name: otherUser.name,
          username: otherUser.username,
          avatar: otherUser.avatar,
          isOnline: otherUser.isOnline,
          lastSeen: otherUser.lastSeen,
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

    return NextResponse.json({ friendships: results });
  } catch (error) {
    console.error('Friends GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 });
  }
}
