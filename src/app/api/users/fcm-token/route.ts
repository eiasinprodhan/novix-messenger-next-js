import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fcmToken } = await request.json();

    if (!fcmToken) {
      return NextResponse.json({ error: 'fcmToken is required' }, { status: 400 });
    }

    await User.findByIdAndUpdate(payload.userId, { fcmToken });

    return NextResponse.json({ success: true, message: 'FCM Token updated successfully' });
  } catch (error) {
    console.error('FCM Token update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
