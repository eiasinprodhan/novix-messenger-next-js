import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Story from '@/models/Story';
import { getUserFromRequest } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { isArchived } = await request.json();

    const story = await Story.findById(id);
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    if (story.user.toString() !== payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    story.isArchived = isArchived;
    await story.save();

    const populated = await story.populate('user', 'name username avatar');

    return NextResponse.json({ success: true, story: populated });
  } catch (error) {
    console.error('Story archive error:', error);
    return NextResponse.json({ error: 'Failed to archive story' }, { status: 500 });
  }
}
