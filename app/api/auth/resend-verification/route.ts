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
  try {
    await connectDB();

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400, headers: corsHeaders() });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: corsHeaders() });
    }

    if (user.isVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400, headers: corsHeaders() });
    }

    // Rate limit: 60 seconds between resends
    if (user.verificationResendAt) {
      const secondsSinceLastResend = (Date.now() - user.verificationResendAt.getTime()) / 1000;
      if (secondsSinceLastResend < 60) {
        const wait = Math.ceil(60 - secondsSinceLastResend);
        return NextResponse.json(
          { error: `Please wait ${wait} seconds before requesting a new code.` },
          { status: 429, headers: corsHeaders() }
        );
      }
    }

    const code = generateOTP();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    user.verificationCode = code;
    user.verificationCodeExpires = expires;
    user.verificationResendAt = new Date();
    await user.save();

    try {
      await sendVerificationEmail(user.email, code);
    } catch (emailErr: any) {
      console.error('>>> [RESEND-VERIFICATION] Email failed:', emailErr.message);
      return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500, headers: corsHeaders() });
    }

    console.log('>>> [RESEND-VERIFICATION] Resent to', user.email);

    return NextResponse.json({
      success: true,
      message: 'A new verification code has been sent to your email.',
    }, { status: 200, headers: corsHeaders() });

  } catch (error: any) {
    console.error('>>> [RESEND-VERIFICATION] ERROR:', error);
    return NextResponse.json({ error: 'Failed to resend code' }, { status: 500, headers: corsHeaders() });
  }
}
