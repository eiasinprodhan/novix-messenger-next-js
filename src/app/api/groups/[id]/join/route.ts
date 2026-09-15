import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import { getUserFromRequest } from '@/lib/auth';

// POST /api/groups/[id]/join
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const group = await Group.findById(id);
    if (!group || !group.isActive) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const isMember = group.members.some(
      (m: any) => m.user.toString() === payload.userId
    );
    if (isMember) {
      return NextResponse.json({ joined: true, message: 'Already a member' });
    }

    if (group.autoApprove) {
      group.members.push({
        user: payload.userId as any,
        role: 'member',
        joinedAt: new Date(),
      });
      group.pendingRequests = group.pendingRequests.filter(
        (uId) => uId.toString() !== payload.userId
      );
      await group.save();
      return NextResponse.json({ joined: true, message: 'Joined group successfully' });
    } else {
      const alreadyRequested = group.pendingRequests.some(
        (uId) => uId.toString() === payload.userId
      );
      if (!alreadyRequested) {
        group.pendingRequests.push(payload.userId as any);
        await group.save();
      }
      return NextResponse.json({ joined: false, requested: true, message: 'Join request submitted' });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to process join request' }, { status: 500 });
  }
}
