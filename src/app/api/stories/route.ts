import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Story from '@/models/Story';
import Friendship from '@/models/Friendship';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl } = await request.json();
    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 });
    }

    const story = await Story.create({
      user: payload.userId,
      imageUrl,
      isArchived: false,
      reactions: [],
    });

    const populated = await story.populate('user', 'name username avatar');

    return NextResponse.json({ success: true, story: populated }, { status: 201 });
  } catch (error) {
    console.error('Stories POST error:', error);
    return NextResponse.json({ error: 'Failed to create story' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get list of accepted friends
    const friendships = await Friendship.find({
      $or: [
        { requester: payload.userId, status: 'accepted' },
        { recipient: payload.userId, status: 'accepted' },
      ],
    });

    const friendIds = friendships.map((f) =>
      f.requester.toString() === payload.userId ? f.recipient.toString() : f.requester.toString()
    );

    // 2. Include the user themselves in the feed
    const userIds = [payload.userId, ...friendIds];

    // 3. Find active, non-archived stories created within the last 24 hours
    const activeTimeLimit = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stories = await Story.find({
      user: { $in: userIds },
      isArchived: false,
      createdAt: { $gte: activeTimeLimit },
    })
      .sort({ createdAt: 1 }) // oldest first to play in sequence
      .populate([
        { path: 'user', select: 'name username avatar' },
        { path: 'reactions.user', select: 'name username avatar' }
      ]);

    return NextResponse.json({ success: true, stories });
  } catch (error) {
    console.error('Stories GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch stories feed' }, { status: 500 });
  }
}
