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

    const story = await Story.findById(id);
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Check stealth mode for premium users
    const body = await request.json().catch(() => ({}));
    let isStealth = body.stealth === true;
    if (!isStealth) {
      const User = (await import('@/models/User')).default;
      const viewerUser = await User.findById(payload.userId).select('isPremium stealthMode');
      if (viewerUser?.isPremium && viewerUser?.stealthMode) {
        isStealth = true;
      }
    }

    // Do not add the owner to viewers or stealth viewers
    if (story.user.toString() !== payload.userId && !isStealth) {
      if (!story.viewers) {
        story.viewers = [];
      }
      if (!story.viewers.some((vId) => vId.toString() === payload.userId)) {
        story.viewers.push(payload.userId as any);
        await story.save();
      }
    }

    const populated = await story.populate([
      { path: 'user', select: 'name username avatar' },
      { path: 'reactions.user', select: 'name username avatar' },
      { path: 'viewers', select: 'name username avatar' }
    ]);

    return NextResponse.json({ success: true, story: populated });
  } catch (error) {
    console.error('Story view error:', error);
    return NextResponse.json({ error: 'Failed to record story view' }, { status: 500 });
  }
}
