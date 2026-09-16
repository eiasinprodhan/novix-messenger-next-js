import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/lib/auth';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token required' }, { status: 400, headers: corsHeaders() });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired refresh token. Please log in again.' }, { status: 401, headers: corsHeaders() });
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: corsHeaders() });
    }

    // Update user activity
    user.lastActiveAt = new Date();
    await user.save();

    const deviceId = request.headers.get('x-device-id');
    if (deviceId) {
      const { updateDeviceActivity } = await import('@/lib/device');
      await updateDeviceActivity(user._id.toString(), request);
    }

    const newAccessToken = generateAccessToken({ userId: user._id.toString(), email: user.email, role: user.role });
    const newRefreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email, role: user.role });

    console.log('>>> [REFRESH] Tokens refreshed for', user.email);

    return NextResponse.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }, { status: 200, headers: corsHeaders() });

  } catch (error: any) {
    console.error('>>> [REFRESH] ERROR:', error);
    return NextResponse.json({ error: 'Token refresh failed' }, { status: 500, headers: corsHeaders() });
  }
}
