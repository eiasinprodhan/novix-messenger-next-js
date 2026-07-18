import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Story from '@/models/Story';
import { getUserFromRequest } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const story = await Story.findById(id);
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    if (story.user.toString() !== payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await Story.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Story delete error:', error);
    return NextResponse.json({ error: 'Failed to delete story' }, { status: 500 });
  }
}
