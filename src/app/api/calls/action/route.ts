import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { dispatchCallAction } from '@/lib/socket';

export async function POST(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, callId, targetUserId, groupId } = body;

    if (!action || !callId) {
      return NextResponse.json({ error: 'action and callId are required' }, { status: 400 });
    }

    if (!['answer', 'decline', 'end'].includes(action)) {
      return NextResponse.json({ error: 'Invalid call action' }, { status: 400 });
    }

    await dispatchCallAction({
      action,
      callId,
      senderId: payload.userId,
      targetUserId,
      groupId,
    });

    return NextResponse.json({ success: true, action, callId });
  } catch (error) {
    console.error('Call action POST error:', error);
    return NextResponse.json({ error: 'Failed to process call action' }, { status: 500 });
  }
}
