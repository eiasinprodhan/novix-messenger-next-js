import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { createGroupSystemMessage } from '@/lib/groupSystemMessage';

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
      .map((uid: string) => ({ user: uid as any, role: 'member' as const, joinedAt: new Date() }));

    const newlyAddedIds = newMembers.map((m: any) => m.user.toString());
    group.members.push(...newMembers);
    await group.save();

    const populated = await Group.findById(id)
      .populate('members.user', 'name username avatar isOnline');

    // Emit system message for added members
    if (newlyAddedIds.length > 0) {
      const callerUser = await User.findById(payload.userId).select('name');
      const callerName = callerUser?.name || 'Someone';
      const addedUsers = await User.find({ _id: { $in: newlyAddedIds } }).select('name');
      const addedNames = addedUsers.map((u) => u.name).filter(Boolean);

      if (addedNames.length > 0) {
        await createGroupSystemMessage({
          groupId: id,
          senderId: payload.userId,
          content: `${callerName} added ${addedNames.join(', ')}`,
          extraUserIdsToNotify: newlyAddedIds,
          updatedGroup: populated,
        });
      }
    }

    return NextResponse.json({ success: true, group: populated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add members' }, { status: 500 });
  }
}

// DELETE: Remove member or Leave group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { userId: userToRemove, newAdminId } = await request.json();

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

    let promotedNewAdminName: string | null = null;

    // If the creator is trying to leave the group:
    const isCreator = (group.createdBy?._id || group.createdBy)?.toString() === payload.userId;
    if (userToRemove === payload.userId && isCreator) {
      const otherMembers = group.members.filter((m: any) => (m.user?._id || m.user || m)?.toString() !== payload.userId);
      if (otherMembers.length > 0) {
        if (newAdminId) {
          const replacement = group.members.find((m: any) => (m.user?._id || m.user || m)?.toString() === newAdminId);
          if (replacement) {
            replacement.role = 'admin';
            group.createdBy = replacement.user;
            const repUser = await User.findById(newAdminId).select('name');
            promotedNewAdminName = repUser?.name || null;
          }
        }
        // Re-check after potential promotion
        const hasOtherAdmin = group.members.some(
          (m: any) => (m.user?._id || m.user || m)?.toString() !== payload.userId && m.role === 'admin'
        );
        if (!hasOtherAdmin) {
          return NextResponse.json({
            error: 'You cannot leave the group you created without assigning another member as group admin first.',
            requireNewAdmin: true,
          }, { status: 400 });
        }
      }
    } else {
      // Prevent removing the last admin if there are other members (non-creator path)
      const admins = group.members.filter((m: any) => m.role === 'admin');
      if (targetMember?.role === 'admin' && admins.length === 1 && group.members.length > 1) {
        return NextResponse.json({
          error: 'Cannot leave or remove the only admin. You must make another member an admin first.',
          requireNewAdmin: true,
        }, { status: 400 });
      }
    }

    group.members = group.members.filter((m: any) => (m.user?._id || m.user || m)?.toString() !== userToRemove);
    await group.save();

    const populated = await Group.findById(id)
      .populate('members.user', 'name username avatar isOnline');

    // Create system messages
    const callerUser = await User.findById(payload.userId).select('name');
    const callerName = callerUser?.name || 'Someone';

    if (userToRemove === payload.userId) {
      // Self left
      if (promotedNewAdminName) {
        await createGroupSystemMessage({
          groupId: id,
          senderId: payload.userId,
          content: `${callerName} made ${promotedNewAdminName} a group admin`,
          extraUserIdsToNotify: [newAdminId],
          updatedGroup: populated,
        });
      }

      await createGroupSystemMessage({
        groupId: id,
        senderId: payload.userId,
        content: `${callerName} left the group`,
        extraUserIdsToNotify: [userToRemove],
        updatedGroup: populated,
      });
    } else {
      // Removed by admin
      const removedUser = await User.findById(userToRemove).select('name');
      const removedName = removedUser?.name || 'Someone';

      await createGroupSystemMessage({
        groupId: id,
        senderId: payload.userId,
        content: `${callerName} removed ${removedName}`,
        extraUserIdsToNotify: [userToRemove],
        updatedGroup: populated,
      });
    }

    return NextResponse.json({ success: true, group: populated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}

// PATCH: Update a member's role (promote to admin / demote to member)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { userId: targetUserId, role } = await request.json();

    if (!targetUserId || !['admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'userId and role (admin|member) are required' }, { status: 400 });
    }

    const group = await Group.findById(id);
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    // Caller must be an admin or the creator
    const callerMember = group.members.find((m: any) => (m.user?._id || m.user)?.toString() === payload.userId);
    const isCreatorCaller = (group.createdBy?._id || group.createdBy)?.toString() === payload.userId;
    if (!callerMember || (callerMember.role !== 'admin' && !isCreatorCaller)) {
      return NextResponse.json({ error: 'Only admins can change member roles' }, { status: 403 });
    }

    // Cannot demote the group creator
    const isTargetCreator = (group.createdBy?._id || group.createdBy)?.toString() === targetUserId;
    if (isTargetCreator && role === 'member') {
      return NextResponse.json({ error: 'Cannot demote the group creator' }, { status: 400 });
    }

    const targetMember = group.members.find((m: any) => (m.user?._id || m.user)?.toString() === targetUserId);
    if (!targetMember) {
      return NextResponse.json({ error: 'User is not a member of this group' }, { status: 404 });
    }

    const previousRole = targetMember.role;
    targetMember.role = role;
    await group.save();

    const populated = await Group.findById(id)
      .populate('members.user', 'name username avatar isOnline');

    // Emit system message if role actually changed
    if (previousRole !== role) {
      const callerUser = await User.findById(payload.userId).select('name');
      const callerName = callerUser?.name || 'Someone';
      const targetUser = await User.findById(targetUserId).select('name');
      const targetName = targetUser?.name || 'Someone';

      const roleText = role === 'admin'
        ? `${callerName} made ${targetName} a group admin`
        : `${callerName} removed ${targetName} as group admin`;

      await createGroupSystemMessage({
        groupId: id,
        senderId: payload.userId,
        content: roleText,
        extraUserIdsToNotify: [targetUserId],
        updatedGroup: populated,
      });
    }

    return NextResponse.json({ success: true, group: populated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 });
  }
}
