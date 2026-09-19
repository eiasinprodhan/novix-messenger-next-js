import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { getUserFromRequest } from '@/lib/auth';

async function verifyAdmin(request: NextRequest) {
  const decoded = getUserFromRequest(request);
  if (!decoded || decoded.role !== 'admin') {
    return null;
  }
  return decoded;
}

// GET /api/admin/monetization - Get overview & user monetization details
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const [totalUsers, totalPremiumUsers, starAggregation] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isPremium: true }),
      User.aggregate([
        {
          $group: {
            _id: null,
            totalStars: { $sum: '$starsBalance' },
          },
        },
      ]),
    ]);

    const totalStarsInCirculation = starAggregation[0]?.totalStars || 0;

    let filter: any = {};
    if (query) {
      const regex = new RegExp(query, 'i');
      filter = {
        $or: [{ name: regex }, { username: regex }, { email: regex }],
      };
    }

    const users = await User.find(filter)
      .select('name username email avatar starsBalance isPremium premiumPlan premiumExpiresAt createdAt')
      .sort({ starsBalance: -1, isPremium: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const count = await User.countDocuments(filter);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalPremiumUsers,
        totalStarsInCirculation,
      },
      pagination: {
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
      },
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        username: u.username,
        email: u.email,
        avatar: u.avatar || '',
        starsBalance: u.starsBalance || 0,
        isPremium: !!u.isPremium,
        premiumPlan: u.premiumPlan || 'free',
        premiumExpiresAt: u.premiumExpiresAt,
        createdAt: u.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Admin Monetization GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch monetization telemetry' }, { status: 500 });
  }
}

// POST /api/admin/monetization - Adjust Stars or toggle Premium
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { action, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    if (action === 'adjust_stars') {
      const { amount, mode = 'add', reason } = body;
      const numAmount = parseInt(amount, 10);
      if (isNaN(numAmount)) {
        return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
      }

      const prevStars = targetUser.starsBalance || 0;
      let newStars = prevStars;

      if (mode === 'add') {
        newStars = prevStars + numAmount;
      } else if (mode === 'deduct') {
        newStars = Math.max(0, prevStars - numAmount);
      } else if (mode === 'set') {
        newStars = Math.max(0, numAmount);
      }

      targetUser.starsBalance = newStars;

      // Add to star transactions
      if (!targetUser.starTransactions) {
        targetUser.starTransactions = [];
      }
      targetUser.starTransactions.unshift({
        id: `admin_adj_${Date.now()}`,
        type: 'reward',
        amount: Math.abs(newStars - prevStars),
        title: reason ? `Admin Adjustment: ${reason}` : 'Administrative Balance Adjustment',
        description: `Updated by Novix Admin (${admin.email || 'support@novix.me'})`,
        createdAt: new Date(),
      });

      await targetUser.save();

      try {
        await AuditLog.create({
          admin: admin.userId as any,
          action: 'ADJUST_USER_STARS',
          targetType: 'User',
          targetId: targetUser._id.toString(),
          details: `Changed Stars for @${targetUser.username} from ${prevStars} to ${newStars}. Reason: ${reason || 'Manual Adjustment'}`,
        });
      } catch (_) {}

      return NextResponse.json({
        success: true,
        starsBalance: targetUser.starsBalance,
        message: `Updated stars for ${targetUser.name} to ${newStars}`,
      });
    }

    if (action === 'set_premium') {
      const { isPremium, plan = 'monthly', durationMonths = 1 } = body;

      const willBePremium = !!isPremium;
      targetUser.isPremium = willBePremium;
      targetUser.premiumPlan = willBePremium ? plan : undefined;

      if (willBePremium) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + parseInt(durationMonths || 1, 10));
        targetUser.premiumExpiresAt = expiresAt;
      } else {
        targetUser.premiumExpiresAt = undefined;
      }

      await targetUser.save();

      try {
        await AuditLog.create({
          admin: admin.userId as any,
          action: willBePremium ? 'GRANT_USER_PREMIUM' : 'REVOKE_USER_PREMIUM',
          targetType: 'User',
          targetId: targetUser._id.toString(),
          details: `${willBePremium ? 'Granted' : 'Revoked'} Novix Premium for @${targetUser.username}`,
        });
      } catch (_) {}

      return NextResponse.json({
        success: true,
        isPremium: targetUser.isPremium,
        premiumPlan: targetUser.premiumPlan,
        premiumExpiresAt: targetUser.premiumExpiresAt,
        message: `${willBePremium ? 'Granted' : 'Revoked'} Novix Premium for ${targetUser.name}`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin Monetization POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update monetization settings' }, { status: 500 });
  }
}
