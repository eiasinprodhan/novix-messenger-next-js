import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';

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

    const auth = requireAuth(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: 401, headers: corsHeaders() });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password are required' }, { status: 400, headers: corsHeaders() });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400, headers: corsHeaders() });
    }

    const user = await User.findById(auth.user.userId).select('+password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: corsHeaders() });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400, headers: corsHeaders() });
    }

    user.password = newPassword;
    await user.save(); // pre-save hook hashes password

    console.log('>>> [CHANGE-PASSWORD] Password changed for', user.email);

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully.',
    }, { status: 200, headers: corsHeaders() });

  } catch (error: any) {
    console.error('>>> [CHANGE-PASSWORD] ERROR:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500, headers: corsHeaders() });
  }
}
