import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';
import { generateOTP, sendEmailChangeEmail } from '@/lib/mailer';

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

    const body = await request.json();
    const { newEmail, code } = body;

    if (!newEmail) {
      return NextResponse.json({ error: 'newEmail is required' }, { status: 400, headers: corsHeaders() });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400, headers: corsHeaders() });
    }

    const user = await User.findById(auth.user.userId).select('+pendingEmailCode');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: corsHeaders() });
    }

    // ─── STEP 2: Verify OTP and finalize email change ───
    if (code) {
      if (!user.pendingEmail || !user.pendingEmailCode || !user.pendingEmailCodeExpires) {
        return NextResponse.json({ error: 'No pending email change found. Please start over.' }, { status: 400, headers: corsHeaders() });
      }

      if (user.pendingEmail.toLowerCase() !== newEmail.toLowerCase()) {
        return NextResponse.json({ error: 'Email mismatch. Please start over.' }, { status: 400, headers: corsHeaders() });
      }

      if (new Date() > user.pendingEmailCodeExpires) {
        return NextResponse.json({ error: 'Code has expired. Please request a new one.' }, { status: 400, headers: corsHeaders() });
      }

      if (user.pendingEmailCode !== code.trim()) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400, headers: corsHeaders() });
      }

      // Apply the email change
      user.email = user.pendingEmail;
      user.pendingEmail = undefined;
      user.pendingEmailCode = undefined;
      user.pendingEmailCodeExpires = undefined;
      user.pendingEmailResendAt = undefined;
      await user.save();

      console.log('>>> [CHANGE-EMAIL] Email changed to', user.email);

      return NextResponse.json({
        success: true,
        message: 'Email changed successfully. Please log in with your new email.',
        forceLogout: true,
      }, { status: 200, headers: corsHeaders() });
    }

    // ─── STEP 1: Send OTP to new email ───

    // Check if new email is already in use
    const existing = await User.findOne({ email: newEmail.toLowerCase() });
    if (existing && existing._id.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'This email is already in use by another account' }, { status: 409, headers: corsHeaders() });
    }

    if (newEmail.toLowerCase() === user.email.toLowerCase()) {
      return NextResponse.json({ error: 'This is already your current email' }, { status: 400, headers: corsHeaders() });
    }

    // Rate limit: 60 seconds
    if (user.pendingEmailResendAt) {
      const secondsSince = (Date.now() - user.pendingEmailResendAt.getTime()) / 1000;
      if (secondsSince < 60) {
        const wait = Math.ceil(60 - secondsSince);
        return NextResponse.json(
          { error: `Please wait ${wait} seconds before requesting a new code.` },
          { status: 429, headers: corsHeaders() }
        );
      }
    }

    const otpCode = generateOTP();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    user.pendingEmail = newEmail.toLowerCase();
    user.pendingEmailCode = otpCode;
    user.pendingEmailCodeExpires = expires;
    user.pendingEmailResendAt = new Date();
    await user.save();

    try {
      await sendEmailChangeEmail(newEmail, otpCode);
      console.log('>>> [CHANGE-EMAIL] OTP sent to new email', newEmail);
    } catch (emailErr: any) {
      console.error('>>> [CHANGE-EMAIL] Email failed:', emailErr.message);
      return NextResponse.json({ error: 'Failed to send verification email. Please try again.' }, { status: 500, headers: corsHeaders() });
    }

    return NextResponse.json({
      success: true,
      message: `A verification code has been sent to ${newEmail}`,
      pendingEmail: newEmail,
    }, { status: 200, headers: corsHeaders() });

  } catch (error: any) {
    console.error('>>> [CHANGE-EMAIL] ERROR:', error);
    return NextResponse.json({ error: 'Email change failed' }, { status: 500, headers: corsHeaders() });
  }
}
