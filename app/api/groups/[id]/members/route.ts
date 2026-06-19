import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import { getUserFromRequest } from '@/lib/auth';

// POST: Add members to group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { userIds } = await request.json();
    if (!Array.isArray(userIds)) {
      return NextResponse.json({ error: 'userIds must be an array' }, { status: 400 });
    }

    const group = await Group.findById(id);
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    // Check if current user is admin
    const currentMember = group.members.find((m: any) => m.user.toString() === payload.userId);
    if (!currentMember || currentMember.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can add members' }, { status: 403 });
    }

    // Add new members (avoid duplicates)
    const existingIds = group.members.map((m: any) => m.user.toString());
    const newMembers = userIds
      .filter((uid: string) => !existingIds.includes(uid))
      .map((uid: string) => ({ user: uid, role: 'member' as const }));

    group.members.push(...newMembers);
    await group.save();

    const populated = await Group.findById(id)
      .populate('members.user', 'name username avatar isOnline');

    return NextResponse.json({ success: true, group: populated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add members' }, { status: 500 });
  }
}

// DELETE: Remove member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { userId: userToRemove } = await request.json();

    const group = await Group.findById(id);
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const currentMember = group.members.find((m: any) => m.user.toString() === payload.userId);
    const targetMember = group.members.find((m: any) => m.user.toString() === userToRemove);

    if (!currentMember) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    // Can remove self, or admin can remove others
    const canRemove = 
      userToRemove === payload.userId || 
      currentMember.role === 'admin';

    if (!canRemove) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Prevent removing the last admin
    const admins = group.members.filter((m: any) => m.role === 'admin');
    if (targetMember?.role === 'admin' && admins.length === 1) {
      return NextResponse.json({ error: 'Cannot remove the last admin' }, { status: 400 });
    }

    group.members = group.members.filter((m: any) => m.user.toString() !== userToRemove);
    await group.save();

    const populated = await Group.findById(id)
      .populate('members.user', 'name username avatar isOnline');

    return NextResponse.json({ success: true, group: populated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
