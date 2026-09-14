import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import { getUserFromRequest } from '@/lib/auth';

const getUserId = (u: any) =>
  u?._id?.toString() || u?.id?.toString() || (typeof u === 'string' ? u : u?.toString());

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

    const creatorId = getUserId(group.createdBy);
    const currentMember = group.members.find((m: any) => getUserId(m.user) === payload.userId);
    const isAdmin = currentMember?.role === 'admin' || creatorId === payload.userId;

    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can add members' }, { status: 403 });
    }

    // Add new members (avoid duplicates)
    const existingIds = group.members.map((m: any) => getUserId(m.user));
    const newMembers = userIds
      .filter((uid: string) => !existingIds.includes(uid))
      .map((uid: string) => ({ user: uid as any, role: 'member' as const, joinedAt: new Date() }));

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

    const creatorId = getUserId(group.createdBy);
    const currentMember = group.members.find((m: any) => getUserId(m.user) === payload.userId);
    const isCurrentAdmin = currentMember?.role === 'admin' || creatorId === payload.userId;

    if (!currentMember && !isCurrentAdmin) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    // Can remove self (leave), or admin can remove others
    const canRemove = userToRemove === payload.userId || isCurrentAdmin;

    if (!canRemove) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const remainingMembers = group.members.filter((m: any) => getUserId(m.user) !== userToRemove);

    // If no members remain, deactivate / delete the group
    if (remainingMembers.length === 0) {
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

      return NextResponse.json({ success: true, group, deleted: true });
    }

    // If the departing user was an admin, ensure the group still has at least one admin
    const remainingAdmins = remainingMembers.filter((m: any) => m.role === 'admin');
    if (remainingAdmins.length === 0) {
      // Auto-promote the first remaining member to admin
      remainingMembers[0].role = 'admin';
      // If the creator left, transfer ownership to the new admin
      if (creatorId === userToRemove) {
        group.createdBy = getUserId(remainingMembers[0].user);
      }
    } else if (creatorId === userToRemove) {
      // Transfer creator to the first existing admin
      group.createdBy = getUserId(remainingAdmins[0].user);
    }

    group.members = remainingMembers;
    await group.save();

    const populated = await Group.findById(id)
      .populate('members.user', 'name username avatar isOnline');

    const io = (global as any).socketio;
    if (io) {
      io.to(`group:${id}`).emit('member_left', {
        groupId: id,
        userId: userToRemove,
        newAdminId: remainingAdmins.length === 0 ? getUserId(remainingMembers[0].user) : null,
      });
    }

    return NextResponse.json({ success: true, group: populated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
