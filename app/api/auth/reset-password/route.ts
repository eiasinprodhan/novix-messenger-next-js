import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyResetToken } from '@/lib/auth';

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

    const { resetToken, newPassword } = await request.json();

    if (!resetToken || !newPassword) {
      return NextResponse.json({ error: 'Reset token and new password are required' }, { status: 400, headers: corsHeaders() });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400, headers: corsHeaders() });
    }

    const payload = verifyResetToken(resetToken);
    if (!payload) {
      return NextResponse.json({ error: 'Reset token is invalid or has expired. Please restart the reset process.' }, { status: 401, headers: corsHeaders() });
    }

    const user = await User.findById(payload.userId).select('+password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: corsHeaders() });
    }

    user.password = newPassword;
    await user.save(); // pre-save hook will hash the password

    console.log('>>> [RESET-PASSWORD] Password reset for', user.email);

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in.',
    }, { status: 200, headers: corsHeaders() });

  } catch (error: any) {
    console.error('>>> [RESET-PASSWORD] ERROR:', error);
    return NextResponse.json({ error: 'Password reset failed' }, { status: 500, headers: corsHeaders() });
  }
}
