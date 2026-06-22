import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateResetToken } from '@/lib/auth';

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

    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400, headers: corsHeaders() });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+resetPasswordCode');
    if (!user) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400, headers: corsHeaders() });
    }

    if (!user.resetPasswordCode || !user.resetPasswordCodeExpires) {
      return NextResponse.json({ error: 'No reset code found. Please request a new one.' }, { status: 400, headers: corsHeaders() });
    }

    if (new Date() > user.resetPasswordCodeExpires) {
      return NextResponse.json({ error: 'Reset code has expired. Please request a new one.' }, { status: 400, headers: corsHeaders() });
    }

    if (user.resetPasswordCode !== code.trim()) {
      return NextResponse.json({ error: 'Invalid reset code' }, { status: 400, headers: corsHeaders() });
    }

    // Clear the code after verification
    user.resetPasswordCode = undefined;
    user.resetPasswordCodeExpires = undefined;
    await user.save();

    // Issue a short-lived reset token (15 min) for the final password-change step
    const resetToken = generateResetToken({ userId: user._id.toString(), email: user.email });

    console.log('>>> [VERIFY-RESET-CODE] Code verified for', user.email);

    return NextResponse.json({
      success: true,
      message: 'Code verified. You may now reset your password.',
      resetToken,
    }, { status: 200, headers: corsHeaders() });

  } catch (error: any) {
    console.error('>>> [VERIFY-RESET-CODE] ERROR:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500, headers: corsHeaders() });
  }
}
