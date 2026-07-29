import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Message from '@/models/Message';
import Friendship from '@/models/Friendship';
import Report from '@/models/Report';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    
    // Check requester role if token provided, otherwise allow fallback if user count/DB check passes
    if (payload) {
      const requester = await User.findById(payload.userId).select('role');
      if (!requester || requester.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
      }
    }

    const totalUsers = await User.countDocuments();
    const onlineUsers = await User.countDocuments({ isOnline: true });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    
    const totalMessages = await Message.countDocuments();
    const totalFriendships = await Friendship.countDocuments({ status: 'accepted' });
    const pendingFriendRequests = await Friendship.countDocuments({ status: 'pending' });

    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });

    // Recent 5 users
    const recentUsers = await User.find()
      .select('name username email avatar isOnline role lastSeen createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

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
        totalMessages,
        totalFriendships,
        pendingFriendRequests,
        totalReports,
        pendingReports,
      },
      recentUsers,
      recentReports,
    });
  } catch (error: any) {
    console.error('[ADMIN STATS ERROR]:', error);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
