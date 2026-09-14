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
      .populate('pendingRequests', 'name username avatar isOnline')
      .populate('createdBy', 'name username')
      .populate('pinnedMessage');

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const isMember = group.members.some((m: any) => m.user && m.user._id && m.user._id.toString() === payload.userId);

    return NextResponse.json({ group, isMember });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to get group' }, { status: 500 });
  }
}

const getUserId = (u: any) =>
  u?._id?.toString() || u?.id?.toString() || (typeof u === 'string' ? u : u?.toString());

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

    const creatorId = getUserId(group.createdBy);
    const currentUserMember = group.members?.find((m: any) => getUserId(m.user) === payload.userId);
    const isAdmin = currentUserMember?.role === 'admin' || creatorId === payload.userId;

    if (!isAdmin && creatorId !== payload.userId) {
      return NextResponse.json({ error: 'Only group admins or the creator can delete this group' }, { status: 403 });
    }

    group.isActive = false;
    group.members = [];
    await group.save();

    const db = (await import('@/lib/sqlite')).getDB();
    db.prepare('DELETE FROM group_members WHERE group_id = ?').run(id);
    db.prepare('UPDATE groups SET is_active = 0, updated_at = ? WHERE id = ?').run(new Date().toISOString(), id);

    const io = (global as any).socketio;
    if (io) {
      io.to(`group:${id}`).emit('group_deleted', { groupId: id });
    }

    return NextResponse.json({ success: true, message: 'Group deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to delete group' }, { status: 500 });
  }
}

// PUT update group details (name, description, avatar)
export async function PUT(
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

    const creatorId = getUserId(group.createdBy);
    const currentUserMember = group.members?.find((m: any) => getUserId(m.user) === payload.userId);
    const isCreator = creatorId === payload.userId;
    const isAdmin = currentUserMember?.role === 'admin' || isCreator;

    if (!currentUserMember && !isCreator) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Only group admins can update group details' }, { status: 403 });
    }

    const { name, description, avatar, hideMembers, groupType, topicsEnabled, pinnedMessageId, autoApprove, slowModeSeconds, permissions, autoDeleteSeconds } = await request.json();

    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        return NextResponse.json({ error: 'Group name must be at least 2 characters' }, { status: 400 });
      }
      group.name = name.trim();
    }

    if (description !== undefined) {
      group.description = description.trim();
    }

    if (avatar !== undefined) {
      group.avatar = avatar;
    }

    if (hideMembers !== undefined) {
      group.hideMembers = Boolean(hideMembers);
    }

    if (groupType !== undefined) {
      group.groupType = groupType;
    }

    if (topicsEnabled !== undefined) {
      group.topicsEnabled = Boolean(topicsEnabled);
    }

    if (pinnedMessageId !== undefined) {
      group.pinnedMessage = pinnedMessageId ? pinnedMessageId : null;
    }

    if (autoApprove !== undefined) {
      group.autoApprove = Boolean(autoApprove);
    }

    if (slowModeSeconds !== undefined) {
      group.slowModeSeconds = Number(slowModeSeconds);
    }

    if (permissions !== undefined) {
      group.permissions = { ...group.permissions, ...permissions };
    }

    if (autoDeleteSeconds !== undefined) {
      group.autoDeleteSeconds = Number(autoDeleteSeconds);
    }

    await group.save();

    const populated = await Group.findById(group._id)
      .populate('members.user', 'name username avatar isOnline lastSeen')
      .populate('pendingRequests', 'name username avatar isOnline')
      .populate('createdBy', 'name username')
      .populate('pinnedMessage');

    return NextResponse.json({ success: true, group: populated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update group' }, { status: 500 });
  }
}
