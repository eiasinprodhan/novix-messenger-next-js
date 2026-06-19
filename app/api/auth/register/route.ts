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

    const user = await User.create({
      name: name.trim(),
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password,
      isVerified: true,
    });

    const accessToken = generateAccessToken({ userId: user._id.toString(), email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email, role: user.role });

    console.log('>>> [REGISTER] SUCCESS for', user.email);

    return NextResponse.json({
      success: true,
      message: 'Account created',
      user: user.toJSON(),
      accessToken,
      refreshToken,
    }, { status: 201, headers: corsHeaders() });

  } catch (error: any) {
    console.error('>>> [REGISTER] ERROR:', error);
    return NextResponse.json({ 
      error: 'Registration failed', 
      detail: (error?.message || 'Unknown error').substring(0, 180) 
    }, { status: 500, headers: corsHeaders() });
  }
}
