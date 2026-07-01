import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import { getUserFromRequest } from '@/lib/auth';

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Messages clear error:', error);
    return NextResponse.json({ error: 'Failed to clear chat' }, { status: 500 });
  }
}
