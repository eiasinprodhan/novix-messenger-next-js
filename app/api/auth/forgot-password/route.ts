import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateOTP, sendPasswordResetEmail } from '@/lib/mailer';

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

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400, headers: corsHeaders() });
    }

    // Always respond with success to avoid user enumeration
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+resetPasswordCode');
    if (!user) {
      console.log('>>> [FORGOT-PASSWORD] No user found for', email);
      return NextResponse.json({ error: 'No account found with this email address.' }, { status: 404, headers: corsHeaders() });
    }

    if (!user.isVerified) {
      return NextResponse.json({ error: 'Account is not verified. Please verify your email first.' }, { status: 403, headers: corsHeaders() });
    }

    const code = generateOTP();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    user.resetPasswordCode = code;
    user.resetPasswordCodeExpires = expires;
    await user.save();

    try {
      await sendPasswordResetEmail(user.email, code);
      console.log('>>> [FORGOT-PASSWORD] Reset code sent to', user.email);
    } catch (emailErr: any) {
      console.error('>>> [FORGOT-PASSWORD] Email failed:', emailErr.message);
      return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500, headers: corsHeaders() });
    }

    return NextResponse.json({
      success: true,
      message: 'If this email exists, a reset code has been sent.',
    }, { status: 200, headers: corsHeaders() });

  } catch (error: any) {
    console.error('>>> [FORGOT-PASSWORD] ERROR:', error);
    return NextResponse.json({ error: 'Request failed' }, { status: 500, headers: corsHeaders() });
  }
}
