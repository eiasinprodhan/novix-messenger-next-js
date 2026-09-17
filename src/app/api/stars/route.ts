import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

const STAR_PACKAGES = [
  { id: 'stars_50', stars: 50, priceUsd: 0.99, isPopular: false, isBestValue: false },
  { id: 'stars_100', stars: 100, priceUsd: 1.99, isPopular: false, isBestValue: false },
  { id: 'stars_250', stars: 250, priceUsd: 4.99, isPopular: true, isBestValue: false },
  { id: 'stars_500', stars: 500, priceUsd: 9.99, isPopular: false, isBestValue: false },
  { id: 'stars_1000', stars: 1000, priceUsd: 19.99, isPopular: false, isBestValue: false },
  { id: 'stars_2500', stars: 2500, priceUsd: 49.99, isPopular: false, isBestValue: true },
];

// GET /api/stars
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(payload.userId).select('starsBalance starTransactions');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Default 250 stars if never initialized
    const balance = typeof user.starsBalance === 'number' ? user.starsBalance : 250;
    const transactions = user.starTransactions || [];

    return NextResponse.json({
      balance,
      transactions,
      packages: STAR_PACKAGES,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch stars data' }, { status: 500 });
  }
}

// POST /api/stars
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { packageId, stars: requestedStars } = body;

    const pkg = STAR_PACKAGES.find((p) => p.id === packageId) || {
      stars: requestedStars || 50,
      priceUsd: 0.99,
    };

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.starsBalance = (user.starsBalance || 0) + pkg.stars;
    if (!user.starTransactions) user.starTransactions = [];

    const newTx = {
      id: 'tx_' + Date.now(),
      type: 'purchase' as const,
      amount: pkg.stars,
      title: `Purchased ${pkg.stars} Telegram Stars`,
      description: `Payment of $${pkg.priceUsd} confirmed`,
      createdAt: new Date(),
    };

    user.starTransactions.unshift(newTx);
    await user.save();

    return NextResponse.json({
      success: true,
      balance: user.starsBalance,
      transaction: newTx,
      message: `Successfully purchased ${pkg.stars} Stars!`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to buy stars' }, { status: 500 });
  }
}
