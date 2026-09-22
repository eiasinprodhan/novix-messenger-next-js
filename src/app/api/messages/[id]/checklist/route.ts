import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { itemId } = body;

    const message = await Message.findById(id);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (!message.checklist || !message.checklist.items) {
      return NextResponse.json({ error: 'Message does not have a checklist' }, { status: 400 });
    }

    const item = message.checklist.items.find((i: any) => i.id === itemId);
    if (!item) {
      return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 });
    }

    item.completed = !item.completed;
    item.completedBy = item.completed ? (payload.userId as any) : undefined;

    message.markModified('checklist');
    await message.save();

    return NextResponse.json({
      success: true,
      checklist: message.checklist,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update checklist' }, { status: 500 });
  }
}
