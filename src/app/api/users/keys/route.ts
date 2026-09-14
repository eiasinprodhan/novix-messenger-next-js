import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const user = await User.findById(userId).select('publicKey name username');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      userId: user._id,
      publicKey: user.publicKey || null,
      name: user.name,
      username: user.username,
    });
  } catch (error) {
    console.error('Keys GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve public key' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { publicKey } = await request.json();
    if (!publicKey || typeof publicKey !== 'string') {
      return NextResponse.json({ error: 'publicKey is required' }, { status: 400 });
    }

    await User.findByIdAndUpdate(payload.userId, { publicKey });

    return NextResponse.json({
      success: true,
      publicKey,
    });
  } catch (error) {
    console.error('Keys POST error:', error);
    return NextResponse.json({ error: 'Failed to update public key' }, { status: 500 });
  }
}
