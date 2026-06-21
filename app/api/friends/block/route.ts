import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Friendship from '@/models/Friendship';
import { getUserFromRequest } from '@/lib/auth';

// POST /api/friends/block
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { friendId } = body;

    if (!friendId) {
      return NextResponse.json({ error: 'friendId is required' }, { status: 400 });
    }

    if (friendId === payload.userId) {
      return NextResponse.json({ error: 'You cannot block yourself' }, { status: 400 });
    }

    // Find if there is an existing friendship
    let friendship = await Friendship.findOne({
      $or: [
        { requester: payload.userId, recipient: friendId },
        { requester: friendId, recipient: payload.userId },
      ],
    });

    if (friendship) {
      // Update existing friendship to blocked status and set requester as blocker
      friendship.requester = payload.userId as any;
      friendship.recipient = friendId as any;
      friendship.status = 'blocked';
      await friendship.save();
    } else {
      // Create a new blocked friendship record
      friendship = await Friendship.create({
        requester: payload.userId,
        recipient: friendId,
        status: 'blocked',
      });
    }

    return NextResponse.json({ success: true, friendship });
  } catch (error) {
    console.error('Block POST error:', error);
    return NextResponse.json({ error: 'Failed to block user' }, { status: 500 });
  }
}

// DELETE /api/friends/block
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let friendId = searchParams.get('friendId');

    if (!friendId) {
      try {
        const body = await request.json();
        friendId = body.friendId;
      } catch (e) {}
    }

    if (!friendId) {
      return NextResponse.json({ error: 'friendId is required' }, { status: 400 });
    }

    // Find the blocked friendship
    const friendship = await Friendship.findOne({
      requester: payload.userId,
      recipient: friendId,
      status: 'blocked',
    });

    if (!friendship) {
      return NextResponse.json({ error: 'Block relationship not found or you are not the blocker' }, { status: 404 });
    }

    // Delete the block friendship
    await Friendship.findByIdAndDelete(friendship._id);

    return NextResponse.json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Block DELETE error:', error);
    return NextResponse.json({ error: 'Failed to unblock user' }, { status: 500 });
  }
}
