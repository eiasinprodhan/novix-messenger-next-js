import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import { getUserFromRequest } from '@/lib/auth';

// POST /api/messages/read  — marks all messages in a conversation as read
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { friendId } = await request.json();
    if (!friendId) {
      return NextResponse.json({ error: 'friendId is required' }, { status: 400 });
    }

    // Mark all messages sent by the friend (received by us) as read
    await Message.updateMany(
      {
        sender: friendId,
        receiver: payload.userId,
        status: { $ne: 'read' },
      },
      { $set: { status: 'read' } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Messages read error:', error);
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}
