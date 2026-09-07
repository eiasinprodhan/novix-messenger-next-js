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

    // Non-admin stats calculations
    const totalRegularUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const onlineRegularUsers = await User.countDocuments({ role: { $ne: 'admin' }, isOnline: true });
    const verifiedRegularUsers = await User.countDocuments({ role: { $ne: 'admin' }, isVerified: true });
    const adminCount = await User.countDocuments({ role: 'admin' });

    // Fetch admin user IDs to filter out admin messages if needed
    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    const adminUserIds = adminUsers.map((u) => u._id);

    const totalMessages = await Message.countDocuments({
      sender: { $nin: adminUserIds },
    });

    const totalFriendships = await Friendship.countDocuments({ status: 'accepted' });
    const pendingFriendRequests = await Friendship.countDocuments({ status: 'pending' });

    const totalGroups = Group ? await Group.countDocuments() : 0;
    const totalStories = Story ? await Story.countDocuments({ user: { $nin: adminUserIds } }) : 0;

    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const resolvedReports = await Report.countDocuments({ status: 'resolved' });

    // Recent 6 regular non-admin users
    const recentUsers = await User.find({ role: { $ne: 'admin' } })
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

    // Compute 7-day time series trends
    const now = new Date();
    const last7Days: { dateStr: string; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      last7Days.push({ dateStr, label });
    }

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const messageAgg = await Message.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    ]);
    const messageCountMap = new Map(messageAgg.map((m: any) => [m._id, m.count]));

    const userAgg = await User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    ]);
    const userCountMap = new Map(userAgg.map((u: any) => [u._id, u.count]));

    const messageTrends = last7Days.map(({ dateStr, label }) => ({
      date: dateStr,
      label,
      messages: messageCountMap.get(dateStr) || 0,
    }));

    const userTrends = last7Days.map(({ dateStr, label }) => ({
      date: dateStr,
      label,
      users: userCountMap.get(dateStr) || 0,
    }));

    return NextResponse.json({
      stats: {
        totalUsers: totalRegularUsers,
        onlineUsers: onlineRegularUsers,
        verifiedUsers: verifiedRegularUsers,
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
      messageTrends,
      userTrends,
      recentUsers,
      recentLogs,
      recentReports,
    });
  } catch (error: any) {
    console.error('[ADMIN STATS ERROR]:', error);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
