import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const friendId = searchParams.get('friendId');
    const groupId = searchParams.get('groupId');
    const senderId = searchParams.get('senderId');
    const mediaType = searchParams.get('mediaType'); // 'media' | 'document' | 'audio' | 'link'
    const limit = parseInt(searchParams.get('limit') || '50');

    const query: any = {
      isDeleted: false,
      deletedBy: { $ne: payload.userId },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    };

    if (groupId) {
      query.group = groupId;
    } else if (friendId) {
      query.$and = [
        {
          $or: [
            { sender: payload.userId, receiver: friendId },
            { sender: friendId, receiver: payload.userId },
          ],
        },
      ];
    } else {
      // Global search across chats user participates in
      query.$or = [
        { sender: payload.userId },
        { receiver: payload.userId },
      ];
    }

    if (senderId) {
      query.sender = senderId;
    }

    if (q) {
      query.content = { $regex: q, $options: 'i' };
    }

    if (mediaType) {
      if (mediaType === 'media') {
        query.type = { $in: ['image', 'video'] };
      } else if (mediaType === 'document') {
        query.type = 'document';
      } else if (mediaType === 'audio') {
        query.type = { $in: ['audio', 'voice'] };
      } else if (mediaType === 'link') {
        query.content = { $regex: 'https?://', $options: 'i' };
      }
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'name username avatar')
      .populate('receiver', 'name username avatar');

    return NextResponse.json({ messages });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to search messages' }, { status: 500 });
  }
}
