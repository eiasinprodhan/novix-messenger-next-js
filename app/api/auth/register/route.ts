import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
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
  console.log('>>> [REGISTER] POST received');

  try {
    await connectDB();

    const { name, username, email, password } = await request.json();

    if (!name || !username || !email || !password) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400, headers: corsHeaders() });
    }

    const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] });
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409, headers: corsHeaders() });
    }

    const code = generateOTP();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const user = await User.create({
      name: name.trim(),
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password,
      isVerified: false,
      verificationCode: code,
      verificationCodeExpires: expires,
    });

    // Send OTP email (non-blocking background task so Render does not block/timeout)
    sendVerificationEmail(user.email, code)
      .then(() => {
        console.log('>>> [REGISTER] Verification email sent to', user.email);
      })
      .catch((emailErr: any) => {
        console.error('>>> [REGISTER] Email send failed:', emailErr.message);
      });

    console.log('>>> [REGISTER] SUCCESS for', user.email, '— awaiting verification');

    return NextResponse.json({
      success: true,
      message: 'Account created. Please check your email for a verification code.',
      requiresVerification: true,
      userId: user._id.toString(),
      email: user.email,
    }, { status: 201, headers: corsHeaders() });

  } catch (error: any) {
    console.error('>>> [REGISTER] ERROR:', error);
    return NextResponse.json({
      error: 'Registration failed',
      detail: (error?.message || 'Unknown error').substring(0, 180)
    }, { status: 500, headers: corsHeaders() });
  }
}
