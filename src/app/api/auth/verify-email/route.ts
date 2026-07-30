import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth';

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

    const { userId, code } = await request.json();

    if (!userId || !code) {
      return NextResponse.json({ error: 'userId and code are required' }, { status: 400, headers: corsHeaders() });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: corsHeaders() });
    }

    if (user.isVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400, headers: corsHeaders() });
    }

    if (!user.verificationCode || !user.verificationCodeExpires) {
      return NextResponse.json({ error: 'No verification code found. Please request a new one.' }, { status: 400, headers: corsHeaders() });
    }

    if (new Date() > user.verificationCodeExpires) {
      return NextResponse.json({ error: 'Verification code has expired. Please request a new one.' }, { status: 400, headers: corsHeaders() });
    }

    if (user.verificationCode !== code.trim()) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400, headers: corsHeaders() });
    }

    // Mark verified, clear OTP fields
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    user.verificationResendAt = undefined;
    user.isOnline = true;
    user.lastSeen = new Date();
    user.lastActiveAt = new Date();
    await user.save();

    const deviceId = request.headers.get('x-device-id');
    if (deviceId) {
      const { updateDeviceActivity } = await import('@/lib/device');
      await updateDeviceActivity(user._id.toString(), request);
    }

    const accessToken = generateAccessToken({ userId: user._id.toString(), email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email, role: user.role });

    console.log('>>> [VERIFY-EMAIL] Verified and logged in:', user.email);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: user.toJSON(),
      accessToken,
      refreshToken,
    }, { status: 200, headers: corsHeaders() });

  } catch (error: any) {
    console.error('>>> [VERIFY-EMAIL] ERROR:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500, headers: corsHeaders() });
  }
}
