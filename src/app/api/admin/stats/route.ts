import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Message from '@/models/Message';
import Friendship from '@/models/Friendship';
import Report from '@/models/Report';
import AuditLog from '@/models/AuditLog';
import Group from '@/models/Group';
import Story from '@/models/Story';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    
    if (payload) {
      const requester = await User.findById(payload.userId).select('role');
      if (!requester || requester.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
      }
    }

    // Comprehensive Stats
    const totalUsers = await User.countDocuments();
    const onlineUsers = await User.countDocuments({ isOnline: true });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    const totalMessages = await Message.countDocuments();
    const totalFriendships = await Friendship.countDocuments({ status: 'accepted' });
    const pendingFriendRequests = await Friendship.countDocuments({ status: 'pending' });

    const totalGroups = Group ? await Group.countDocuments() : 0;
    const totalStories = Story ? await Story.countDocuments() : 0;

    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const resolvedReports = await Report.countDocuments({ status: 'resolved' });

    // Recent 5 users
    const recentUsers = await User.find()
      .select('name username email avatar isOnline role lastSeen createdAt')
      .sort({ createdAt: -1 })
      .limit(6);

    // Recent 6 audit logs (added, deleted, updated)
    const recentLogs = await AuditLog.find()
      .populate('admin', 'name username email')
      .sort({ createdAt: -1 })
      .limit(6);

    // Recent 5 reports
    const recentReports = await Report.find()
      .populate('reporter', 'name username avatar')
      .populate('reported', 'name username avatar')
      .sort({ createdAt: -1 })
      .limit(5);

    return NextResponse.json({
      stats: {
        totalUsers,
        onlineUsers,
        verifiedUsers,
        adminCount,
        totalMessages,
        totalFriendships,
        pendingFriendRequests,
        totalGroups,
        totalStories,
        totalReports,
        pendingReports,
        resolvedReports,
      },
      recentUsers,
      recentLogs,
      recentReports,
    });
  } catch (error: any) {
    console.error('[ADMIN STATS ERROR]:', error);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
