import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateOTP, sendVerificationEmail } from '@/lib/mailer';

import { getCountryFromRequest } from '@/lib/ipCountry';

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

    const body = await request.json();
    let { name, username, email, password, gender, country, birthday } = body;

    // Auto detect country via IP if not provided
    if (!country || typeof country !== 'string' || !country.trim()) {
      country = await getCountryFromRequest(request);
    }

    if (!name || !username || !email || !password || !gender || !birthday) {
      return NextResponse.json({ error: 'All fields required including gender and birthday' }, { status: 400, headers: corsHeaders() });
    }

    // Validate gender value
    const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
    if (!validGenders.includes(gender)) {
      return NextResponse.json({ error: 'Invalid gender value' }, { status: 400, headers: corsHeaders() });
    }

    // Validate birthday (must be a valid date, user must be at least 13)
    const birthdayDate = new Date(birthday);
    if (isNaN(birthdayDate.getTime())) {
      return NextResponse.json({ error: 'Invalid birthday date' }, { status: 400, headers: corsHeaders() });
    }
    const minAgeDate = new Date();
    minAgeDate.setFullYear(minAgeDate.getFullYear() - 13);
    if (birthdayDate > minAgeDate) {
      return NextResponse.json({ error: 'You must be at least 13 years old to register' }, { status: 400, headers: corsHeaders() });
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
      gender,
      country: country.trim(),
      birthday: birthdayDate,
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
