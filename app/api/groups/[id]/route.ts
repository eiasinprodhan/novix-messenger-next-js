import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import { getUserFromRequest } from '@/lib/auth';

// GET single group details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const group = await Group.findById(id)
      .populate('members.user', 'name username avatar isOnline lastSeen')
      .populate('createdBy', 'name username');

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check membership
    const isMember = group.members.some((m: any) => m.user._id.toString() === payload.userId);
    if (!isMember) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
    }

    return NextResponse.json({ group });
// DELETE group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const group = await Group.findById(id);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Only the creator can delete the group
    if (group.createdBy.toString() !== payload.userId) {
      return NextResponse.json({ error: 'Only the creator can delete this group' }, { status: 403 });
    }

    group.isActive = false;
    await group.save();

    return NextResponse.json({ success: true, message: 'Group deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to delete group' }, { status: 500 });
  }
}
