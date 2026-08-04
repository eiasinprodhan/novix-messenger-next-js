import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

// GET all groups for current user
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const groups = await Group.find({
      'members.user': payload.userId,
      isActive: true,
    })
      .populate('members.user', 'name username avatar isOnline')
      .populate('createdBy', 'name username')
      .sort({ updatedAt: -1 });

    return NextResponse.json({ groups });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

// POST create new group
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, description, avatar, memberIds = [] } = await request.json();

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    const members = [
      { user: payload.userId, role: 'admin' as const },
      ...memberIds
        .filter((id: string) => id !== payload.userId)
        .map((id: string) => ({ user: id, role: 'member' as const })),
    ];

    const group = await Group.create({
      name: name.trim(),
      description: description?.trim() || '',
      avatar: avatar || '',
      createdBy: payload.userId,
      members,
    });

    const populated = await Group.findById(group._id)
      .populate('members.user', 'name username avatar isOnline')
      .populate('createdBy', 'name username');

    return NextResponse.json({ success: true, group: populated }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create group' }, { status: 500 });
  }
}
