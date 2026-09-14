import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import { getUserFromRequest } from '@/lib/auth';

// POST /api/groups/[id]/requests
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

    const currentUserMember = group.members.find(
      (m: any) => m.user.toString() === payload.userId
    );
    const isCreator = group.createdBy.toString() === payload.userId;
    const isAdmin = currentUserMember?.role === 'admin' || isCreator;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can handle join requests' }, { status: 403 });
    }

    const { userId, approve } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    group.pendingRequests = (group.pendingRequests || []).filter(
      (uId: any) => uId.toString() !== userId
    );

    if (approve) {
      const isAlreadyMember = group.members.some(
        (m: any) => m.user.toString() === userId
      );
      if (!isAlreadyMember) {
        group.members.push({
          user: userId as any,
          role: 'member',
          joinedAt: new Date(),
        });
      }
    }

    await group.save();

    const populated = await Group.findById(group._id)
      .populate('members.user', 'name username avatar isOnline lastSeen')
      .populate('pendingRequests', 'name username avatar isOnline')
      .populate('createdBy', 'name username')
      .populate('pinnedMessage');

    return NextResponse.json({ success: true, group: populated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to process request' }, { status: 500 });
  }
}
