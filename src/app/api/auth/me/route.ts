import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { updateDeviceActivity } from '@/lib/device';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(payload.userId)
      .select('-password -verificationCode -verificationCodeExpires -googleId')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update device activity non-blocking in background
    const deviceId = request.headers.get('x-device-id');
    if (deviceId) {
      void updateDeviceActivity(payload.userId, request);
    }

    return NextResponse.json({
      user,
    });

  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
