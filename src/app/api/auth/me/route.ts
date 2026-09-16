import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(payload.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update device activity asynchronously
    const deviceId = request.headers.get('x-device-id');
    if (deviceId) {
      const { updateDeviceActivity } = await import('@/lib/device');
      await updateDeviceActivity(user._id.toString(), request);
    }

    return NextResponse.json({
      user: user.toJSON(),
    });

  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
