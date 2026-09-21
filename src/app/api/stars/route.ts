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
    const { action, recipientId, stars: requestedStars, packageId, message } = body;

    // Direct star transfer / gift to a friend
    if (action === 'transfer' || recipientId) {
      const amount = Number(requestedStars);
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: 'Please specify a valid star amount' }, { status: 400 });
      }

      const sender = await User.findById(payload.userId);
      if (!sender) {
        return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
      }

      const senderBalance = typeof sender.starsBalance === 'number' ? sender.starsBalance : 250;
      if (senderBalance < amount) {
        return NextResponse.json({ error: 'Insufficient star balance' }, { status: 400 });
      }

      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return NextResponse.json({ error: 'Recipient user not found' }, { status: 404 });
      }

      // Deduct from sender
      sender.starsBalance = senderBalance - amount;
      if (!sender.starTransactions) sender.starTransactions = [];

      const senderTx = {
        id: 'tx_' + Date.now() + '_sent',
        type: 'gift_sent' as const,
        amount: -amount,
        title: `Sent ${amount} Stars to ${recipient.name}`,
        description: message?.trim() || `Direct Star Gift`,
        createdAt: new Date(),
      };
      sender.starTransactions.unshift(senderTx);
      await sender.save();

      // Credit recipient
      recipient.starsBalance = (typeof recipient.starsBalance === 'number' ? recipient.starsBalance : 250) + amount;
      if (!recipient.starTransactions) recipient.starTransactions = [];

      const recipientTx = {
        id: 'tx_' + Date.now() + '_rcv',
        type: 'gift_received' as const,
        amount: amount,
        title: `Received ${amount} Stars from ${sender.name}`,
        description: message?.trim() || `Direct Star Gift`,
        createdAt: new Date(),
      };
      recipient.starTransactions.unshift(recipientTx);
      await recipient.save();

      return NextResponse.json({
        success: true,
        balance: sender.starsBalance,
        transaction: senderTx,
        message: `Successfully sent ${amount} Stars to ${recipient.name}!`,
      });
    }

    const pkg = STAR_PACKAGES.find((p) => p.id === packageId) || {
      stars: requestedStars || 50,
      priceUsd: 0.99,
    };

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentBalance = typeof user.starsBalance === 'number' ? user.starsBalance : 250;
    user.starsBalance = currentBalance + pkg.stars;
    if (!user.starTransactions) user.starTransactions = [];

    const newTx = {
      id: 'tx_' + Date.now(),
      type: 'purchase' as const,
      amount: pkg.stars,
      title: `Purchased ${pkg.stars} Novix Stars`,
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
    return NextResponse.json({ error: error.message || 'Failed to process stars request' }, { status: 500 });
  }
}
