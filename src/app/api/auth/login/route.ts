import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { generateOTP, sendVerificationEmail } from '@/lib/mailer';

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
  console.log('>>> [LOGIN] POST received');

  try {
    await connectDB();

    const { email, password } = await request.json();
    console.log('>>> [LOGIN] email:', email);

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400, headers: corsHeaders() });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: corsHeaders() });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: corsHeaders() });
    }

    // If not verified, resend OTP and redirect to verify screen
    if (!user.isVerified) {
      const code = generateOTP();
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      user.verificationCode = code;
      user.verificationCodeExpires = expires;
      await user.save();

      // Send OTP email (non-blocking background task)
      sendVerificationEmail(user.email, code)
        .then(() => {
          console.log('>>> [LOGIN] Verification email sent to', user.email);
        })
        .catch((emailErr: any) => {
          console.error('>>> [LOGIN] Email resend failed:', emailErr.message);
        });

      console.log('>>> [LOGIN] User not verified — resent OTP to', user.email);

      return NextResponse.json({
        requiresVerification: true,
        userId: user._id.toString(),
        email: user.email,
        message: 'Please verify your email. A new code has been sent.',
      }, { status: 403, headers: corsHeaders() });
    }

    user.isOnline = true;
    user.lastSeen = new Date();
    user.lastActiveAt = new Date();
    await user.save();

    const accessToken = generateAccessToken({ userId: user._id.toString(), email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email, role: user.role });

    console.log('>>> [LOGIN] SUCCESS → returning tokens for', user.email);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: user.toJSON(),
      accessToken,
      refreshToken,
    }, { status: 200, headers: corsHeaders() });

  } catch (error: any) {
    console.error('>>> [LOGIN] ERROR:', error);
    return NextResponse.json({
      error: 'Login failed',
      detail: (error?.message || 'Unknown error').substring(0, 180)
    }, { status: 500, headers: corsHeaders() });
  }
}
