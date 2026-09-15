import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { getUserFromRequest } from '@/lib/auth';

import mongoose from 'mongoose';
import Message from '@/models/Message';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid group ID format' }, { status: 400 });
    }

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized: Session expired or invalid token' }, { status: 401 });
    }

    const adminUser = await User.findById(payload.userId).select('role');
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const group = await Group.findById(id);
    if (!group) {
      return NextResponse.json({ error: 'Group not found or already deleted' }, { status: 404 });
    }

    // Cascade Cleanup: Delete messages in this group channel
    try {
      await Message.deleteMany({ group: id });
    } catch (msgErr) {
      console.warn('Cascade group message cleanup warning:', msgErr);
    }

    await Group.findByIdAndDelete(id);

    await AuditLog.create({
      admin: adminUser._id,
      action: 'DELETE_GROUP',
      targetType: 'Group',
      targetId: group._id.toString(),
      details: { groupName: group.name, memberCount: group.members?.length || 0 },
    });

    return NextResponse.json({ 
      success: true, 
      message: `Group "${group.name}" and all related channel messages deleted successfully.` 
    });
  } catch (error: any) {
    console.error('[ADMIN DELETE GROUP ERROR]:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete group' }, { status: 500 });
  }
}
