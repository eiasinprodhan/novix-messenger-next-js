import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { getUserFromRequest } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    let adminUser = null;
    if (payload) {
      adminUser = await User.findById(payload.userId);
      if (!adminUser || adminUser.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { id } = await params;
    const group = await Group.findById(id);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    await Group.findByIdAndDelete(id);

    if (adminUser) {
      await AuditLog.create({
        admin: adminUser._id,
        action: 'DELETE_GROUP',
        targetType: 'Group',
        targetId: group._id.toString(),
        details: { groupName: group.name },
      });
    }

    return NextResponse.json({ success: true, message: 'Group deleted successfully' });
  } catch (error: any) {
    console.error('[ADMIN DELETE GROUP ERROR]:', error);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}
