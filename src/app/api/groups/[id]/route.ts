import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import Message from '@/models/Message';
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

// DELETE group — hard deletes all messages, clears members, marks inactive
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

    // Only the group creator can delete the group
    if (group.createdBy.toString() !== payload.userId) {
      return NextResponse.json({ error: 'Only the group creator can delete the group' }, { status: 403 });
    }

    // 1. Permanently delete all messages in this group
    await Message.deleteMany({ group: id });

    // 2. Clear all members
    group.members = [];

    // 3. Mark group as inactive
    group.isActive = false;
    await group.save();

    // 4. Notify all connected clients via socket
    try {
      const { getIO } = await import('@/lib/socket');
      const io = getIO();
      if (io) {
        io.to(`group:${id}`).emit('group_deleted', { groupId: id });
      }
    } catch (_) {}

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

    // Check membership and admin permissions
    const currentUserMember = group.members.find(
      (m: any) => m.user.toString() === payload.userId
    );
    if (!currentUserMember) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
    }

    const isCreator = group.createdBy.toString() === payload.userId;
    const isAdmin = currentUserMember.role === 'admin' || isCreator;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only group admins can update group details' }, { status: 403 });
    }

    const {
      name,
      description,
      avatar,
      hideMembers,
      groupType,
      topicsEnabled,
      pinnedMessageId,
      autoApprove,
      slowMode,
      autoDeleteTimer,
      permissions,
    } = await request.json();

    const oldName = group.name;
    const oldAvatar = group.avatar;
    const oldDescription = group.description;
    const oldSlowMode = group.slowMode;

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

    if (slowMode !== undefined) {
      group.slowMode = Number(slowMode);
    }

    if (autoDeleteTimer !== undefined) {
      group.autoDeleteTimer = Number(autoDeleteTimer);
    }

    if (permissions !== undefined && typeof permissions === 'object') {
      group.permissions = {
        ...group.permissions,
        ...permissions,
      };
    }

    await group.save();

    const populated = await Group.findById(group._id)
      .populate('members.user', 'name username avatar isOnline lastSeen')
      .populate('pendingRequests', 'name username avatar isOnline')
      .populate('createdBy', 'name username')
      .populate('pinnedMessage');

    // Create system messages and broadcast updates
    const { createGroupSystemMessage } = await import('@/lib/groupSystemMessage');
    const User = (await import('@/models/User')).default;
    const callerUser = await User.findById(payload.userId).select('name');
    const callerName = callerUser?.name || 'Someone';

    let hasSystemMsg = false;

    if (name !== undefined && name.trim() !== oldName) {
      hasSystemMsg = true;
      await createGroupSystemMessage({
        groupId: id,
        senderId: payload.userId,
        content: `${callerName} changed the group name to "${name.trim()}"`,
        updatedGroup: populated,
      });
    }

    if (avatar !== undefined && avatar !== oldAvatar) {
      hasSystemMsg = true;
      const avatarText = avatar ? `${callerName} changed the group photo` : `${callerName} removed the group photo`;
      await createGroupSystemMessage({
        groupId: id,
        senderId: payload.userId,
        content: avatarText,
        updatedGroup: populated,
      });
    }

    if (description !== undefined && description.trim() !== oldDescription) {
      hasSystemMsg = true;
      await createGroupSystemMessage({
        groupId: id,
        senderId: payload.userId,
        content: `${callerName} changed the group description`,
        updatedGroup: populated,
      });
    }

    if (slowMode !== undefined && Number(slowMode) !== Number(oldSlowMode)) {
      hasSystemMsg = true;
      const s = Number(slowMode);
      const slowModeText = s > 0 ? `${callerName} set slow mode to ${s}s` : `${callerName} disabled slow mode`;
      await createGroupSystemMessage({
        groupId: id,
        senderId: payload.userId,
        content: slowModeText,
        updatedGroup: populated,
      });
    }

    // If other settings changed without a text message, still broadcast group_updated
    if (!hasSystemMsg) {
      try {
        const { getIO } = await import('@/lib/socket');
        const io = getIO();
        if (io) {
          const groupPayload = { groupId: id, group: populated ? (populated.toObject ? populated.toObject() : populated) : null };
          io.to(`group:${id}`).emit('group_updated', groupPayload);
        }
      } catch (_) {}
    }

    return NextResponse.json({ success: true, group: populated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update group' }, { status: 500 });
  }
}
