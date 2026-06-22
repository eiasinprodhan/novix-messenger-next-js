import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'idToken is required' }, { status: 400, headers: corsHeaders() });
    }

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken,
        audience: [
          process.env.GOOGLE_CLIENT_ID || '',
          // Include potential web/android client IDs if they differ
          process.env.GOOGLE_ANDROID_CLIENT_ID || '',
          process.env.GOOGLE_IOS_CLIENT_ID || '',
        ].filter(Boolean),
      });
    } catch (verifyErr: any) {
      console.error('>>> [GOOGLE-AUTH] Token verification failed:', verifyErr.message);
      return NextResponse.json({ error: 'Invalid Google ID Token' }, { status: 400, headers: corsHeaders() });
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 400, headers: corsHeaders() });
    }

    const { email, name, sub: googleId, picture } = payload;

    // Check if user exists by googleId first
    let user = await User.findOne({ googleId });

    if (!user) {
      // If not, check if user exists by email
      user = await User.findOne({ email: email.toLowerCase() });

      if (user) {
        // Link googleId to existing user
        user.googleId = googleId;
        if (!user.avatar && picture) user.avatar = picture;
        // Google verified users are auto-verified
        user.isVerified = true;
        await user.save();
      } else {
        // Create new user
        // Generate a random username based on name or email prefix
        const baseUsername = (email.split('@')[0] || 'user').replace(/[^a-zA-Z0-9_]/g, '');
        let username = baseUsername.toLowerCase();
        let suffix = 1;
        while (await User.findOne({ username })) {
          username = `${baseUsername}${suffix}`.toLowerCase();
          suffix++;
        }

        user = await User.create({
          name: name || 'Google User',
          username,
          email: email.toLowerCase(),
          googleId,
          avatar: picture || '',
          isVerified: true,
          isOnline: true,
          lastSeen: new Date(),
          lastActiveAt: new Date(),
        });
      }
    } else {
      // User exists, update online status and active time
      user.isOnline = true;
      user.lastSeen = new Date();
      user.lastActiveAt = new Date();
      await user.save();
    }

    const accessToken = generateAccessToken({ userId: user._id.toString(), email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email, role: user.role });

    console.log('>>> [GOOGLE-AUTH] SUCCESS for user:', user.email);

    return NextResponse.json({
      success: true,
      message: 'Google login successful',
      user: user.toJSON(),
      accessToken,
      refreshToken,
    }, { status: 200, headers: corsHeaders() });

  } catch (error: any) {
    console.error('>>> [GOOGLE-AUTH] ERROR:', error);
    return NextResponse.json({ error: 'Google login failed' }, { status: 500, headers: corsHeaders() });
  }
}
