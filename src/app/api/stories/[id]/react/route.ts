import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Story from '@/models/Story';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { reaction } = await request.json();
    if (!reaction) {
      return NextResponse.json({ error: 'Missing reaction' }, { status: 400 });
    }

    const story = await Story.findById(id);
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Update reaction from this user or insert new reaction
    const existingIndex = (story.reactions || []).findIndex(
      (r: any) => r.user.toString() === payload.userId
    );

    if (existingIndex > -1) {
      story.reactions[existingIndex].reaction = reaction;
    } else {
      story.reactions.push({
        user: payload.userId as any,
        reaction,
      });
    }

    await story.save();

    const populated = await story.populate([
      { path: 'user', select: 'name username avatar' },
      { path: 'reactions.user', select: 'name username avatar' },
      { path: 'viewers', select: 'name username avatar' }
    ]);

    return NextResponse.json({ success: true, story: populated });
  } catch (error) {
    console.error('Story react error:', error);
    return NextResponse.json({ error: 'Failed to react to story' }, { status: 500 });
  }
}
