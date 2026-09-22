import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/mailer';
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

import { getCountryFromRequest } from '@/lib/ipCountry';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    let { idToken, gender, country, birthday } = body;

    if (!idToken) {
      return NextResponse.json({ error: 'idToken is required' }, { status: 400, headers: corsHeaders() });
    }

    // Auto-detect country via IP if not explicitly provided
    if (!country || typeof country !== 'string' || !country.trim()) {
      country = await getCountryFromRequest(request);
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
    let requiresProfileCompletion = false;

    if (!user) {
      // If not, check if user exists by email
      user = await User.findOne({ email: email.toLowerCase() });

      if (user) {
        // Link googleId to existing user
        user.googleId = googleId;
        if (!user.avatar && picture) user.avatar = picture;
        // Google verified users are auto-verified
        user.isVerified = true;
        // Update profile fields if provided or detected
        if (gender) (user as any).gender = gender;
        if (country) (user as any).country = country.trim();
        if (birthday) (user as any).birthday = new Date(birthday);
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
          country: country ? country.trim() : 'United States',
          ...(gender && { gender }),
          ...(birthday && { birthday: new Date(birthday) }),
        });

        // Send Welcome Email for new Google user (non-blocking)
        const newUser = user;
        if (newUser) {
          sendWelcomeEmail(newUser.email, newUser.name || newUser.username)
            .then(() => {
              console.log('>>> [GOOGLE-AUTH] Welcome email sent to', newUser.email);
            })
            .catch((emailErr: any) => {
              console.error('>>> [GOOGLE-AUTH] Welcome email failed:', emailErr.message);
            });
        }
      }
    } else {
      // User exists, update online status and active time
      user.isOnline = true;
      user.lastSeen = new Date();
      user.lastActiveAt = new Date();
      // Update profile fields if provided
      if (gender) (user as any).gender = gender;
      if (country && (!user.country || user.country === 'Unknown')) (user as any).country = country.trim();
      if (birthday) (user as any).birthday = new Date(birthday);
      await user.save();
    }

    const deviceId = request.headers.get('x-device-id');
    if (deviceId) {
      const { updateDeviceActivity } = await import('@/lib/device');
      await updateDeviceActivity(user._id.toString(), request);
    }

    // Flag if core profile fields are still missing
    const userData = user.toJSON() as any;
    if (!userData.gender || !userData.country || !userData.birthday) {
      requiresProfileCompletion = true;
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
      requiresProfileCompletion,
    }, { status: 200, headers: corsHeaders() });

  } catch (error: any) {
    console.error('>>> [GOOGLE-AUTH] ERROR:', error);
    return NextResponse.json({ error: 'Google login failed' }, { status: 500, headers: corsHeaders() });
  }
}

