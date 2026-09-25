import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Message from '@/models/Message';
import Friendship from '@/models/Friendship';
import Report from '@/models/Report';
import AuditLog from '@/models/AuditLog';
import Group from '@/models/Group';
import Story from '@/models/Story';
import Ad from '@/models/Ad';
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

    // Fetch admin user IDs to filter out admin messages
    const adminUsers = await User.find({ role: 'admin' }).select('_id').lean();
    const adminUserIds = adminUsers.map((u: any) => u._id);

    // Compute 7-day time series trends parameters
    const now = new Date();
    const last7Days: { dateStr: string; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      last7Days.push({ dateStr, label });
    }
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Run all database calls in parallel
    const [
      totalRegularUsers,
      onlineRegularUsers,
      verifiedRegularUsers,
      adminCount,
      totalMessages,
      totalFriendships,
      pendingFriendRequests,
      totalGroups,
      totalStories,
      totalReports,
      pendingReports,
      resolvedReports,
      totalAds,
      activeAds,
      recentUsers,
      recentLogs,
      recentReports,
      messageAgg,
      userAgg,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: { $ne: 'admin' }, isOnline: true }),
      User.countDocuments({ role: { $ne: 'admin' }, isVerified: true }),
      User.countDocuments({ role: 'admin' }),
      Message.countDocuments({ sender: { $nin: adminUserIds } }),
      Friendship.countDocuments({ status: 'accepted' }),
      Friendship.countDocuments({ status: 'pending' }),
      Group ? Group.countDocuments() : Promise.resolve(0),
      Story ? Story.countDocuments({ user: { $nin: adminUserIds } }) : Promise.resolve(0),
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'resolved' }),
      Ad.countDocuments(),
      Ad.countDocuments({ isActive: true, status: 'active' }),
      User.find({ role: { $ne: 'admin' } })
        .select('name username email avatar isOnline role lastSeen createdAt')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      AuditLog.find()
        .populate('admin', 'name username email')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Report.find()
        .populate('reporter', 'name username avatar')
        .populate('reported', 'name username avatar')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Message.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      ]),
    ]);

    const messageCountMap = new Map(messageAgg.map((m: any) => [m._id, m.count]));
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
        totalAds,
        activeAds,
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
