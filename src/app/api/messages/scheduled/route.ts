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
    const friendId = searchParams.get('friendId');
    const groupId = searchParams.get('groupId');

    const query: any = {
      sender: payload.userId,
      scheduledFor: { $gt: new Date() },
      isDeleted: false,
    };

    if (groupId) {
      query.group = groupId;
    } else if (friendId) {
      query.receiver = friendId;
    }

    const messages = await Message.find(query).sort({ scheduledFor: 1 });
    return NextResponse.json({ scheduledMessages: messages });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to get scheduled messages' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { messageId } = await request.json();
    if (!messageId) return NextResponse.json({ error: 'messageId is required' }, { status: 400 });

    const message = await Message.findOne({ _id: messageId, sender: payload.userId });
    if (!message) return NextResponse.json({ error: 'Scheduled message not found' }, { status: 404 });

    message.isDeleted = true;
    await message.save();

    return NextResponse.json({ success: true, messageId });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to cancel scheduled message' }, { status: 500 });
  }
}
