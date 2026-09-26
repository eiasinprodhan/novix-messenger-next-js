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
    let { idToken, googleAccessToken, gender, country, birthday } = body;

    if (!idToken && !googleAccessToken) {
      return NextResponse.json(
        { error: 'idToken or googleAccessToken is required' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Auto-detect country via IP if not explicitly provided
    if (!country || typeof country !== 'string' || !country.trim()) {
      country = await getCountryFromRequest(request);
    }

    let verifiedEmail: string | null = null;
    let verifiedName: string | null = null;
    let verifiedGoogleId: string | null = null;
    let verifiedPicture: string | null = null;

    const allowedAudiences = [
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID,
      process.env.GOOGLE_IOS_CLIENT_ID,
      '342549118730-cas5qac4gl2mf0b6qg2vfqmobe8uuu9g.apps.googleusercontent.com',
      '342549118730-i4im7pp1maa4vji8ve0p3973lm8gjrk8.apps.googleusercontent.com',
    ].filter((id): id is string => Boolean(id && id.trim()));

    // 1. Try verifyIdToken using google-auth-library
    if (idToken) {
      try {
        const ticket = await client.verifyIdToken({
          idToken,
          audience: allowedAudiences,
        });
        const payload = ticket.getPayload();
        if (payload?.email) {
          verifiedEmail = payload.email.toLowerCase();
          verifiedName = payload.name || null;
          verifiedGoogleId = payload.sub;
          verifiedPicture = payload.picture || null;
        }
      } catch (verifyErr: any) {
        console.warn('>>> [GOOGLE-AUTH] client.verifyIdToken failed, trying Google tokeninfo endpoint fallback:', verifyErr.message);
      }

      // 2. Fallback to Google tokeninfo endpoint if verifyIdToken failed
      if (!verifiedEmail) {
        try {
          const tokenInfoRes = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
            { signal: AbortSignal.timeout(5000) }
          );
          if (tokenInfoRes.ok) {
            const tokenInfo = await tokenInfoRes.json();
            if (tokenInfo.email && (tokenInfo.email_verified === 'true' || tokenInfo.email_verified === true)) {
              verifiedEmail = tokenInfo.email.toLowerCase();
              verifiedName = tokenInfo.name || null;
              verifiedGoogleId = tokenInfo.sub;
              verifiedPicture = tokenInfo.picture || null;
              console.log('>>> [GOOGLE-AUTH] Token successfully verified via tokeninfo fallback');
            }
          }
        } catch (tokenInfoErr: any) {
          console.error('>>> [GOOGLE-AUTH] tokeninfo fallback failed:', tokenInfoErr.message);
        }
      }
    }

    // 3. Fallback to Google userinfo using OAuth2 access token if idToken failed or not provided
    if (!verifiedEmail && googleAccessToken) {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${googleAccessToken}` },
          signal: AbortSignal.timeout(5000),
        });
        if (userInfoRes.ok) {
          const userInfo = await userInfoRes.json();
          if (userInfo.email) {
            verifiedEmail = userInfo.email.toLowerCase();
            verifiedName = userInfo.name || null;
            verifiedGoogleId = userInfo.sub;
            verifiedPicture = userInfo.picture || null;
            console.log('>>> [GOOGLE-AUTH] Verified via Google OAuth userinfo endpoint');
          }
        }
      } catch (userInfoErr: any) {
        console.error('>>> [GOOGLE-AUTH] userinfo verification error:', userInfoErr.message);
      }
    }

    if (!verifiedEmail || !verifiedGoogleId) {
      return NextResponse.json(
        { error: 'Invalid Google credentials. Token verification failed.' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const email = verifiedEmail;
    const name = verifiedName;
    const googleId = verifiedGoogleId;
    const picture = verifiedPicture;

    // Check if user exists by googleId first
    let user = await User.findOne({ googleId });
    let requiresProfileCompletion = false;

    if (!user) {
      // If not, check if user exists by email
      user = await User.findOne({ email });

      if (user) {
        // Link googleId to existing user
        user.googleId = googleId;
        if (!user.avatar && picture) user.avatar = picture;
        user.isVerified = true;
        if (gender) (user as any).gender = gender;
        if (country) (user as any).country = country.trim();
        if (birthday) (user as any).birthday = new Date(birthday);
        await user.save({ validateModifiedOnly: true });
      } else {
        // Create new user with valid, safe username
        const sanitized = (email.split('@')[0] || 'user').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
        let baseUsername = sanitized.length >= 3 ? sanitized.slice(0, 24) : `${sanitized}user`.slice(0, 24);
        if (baseUsername.length < 3) baseUsername = 'user';

        let username = baseUsername;
        let suffix = 1;
        while (await User.findOne({ username })) {
          username = `${baseUsername.slice(0, 22)}${suffix}`.toLowerCase();
          suffix++;
        }

        user = await User.create({
          name: name || 'Google User',
          username,
          email,
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
      if (gender) (user as any).gender = gender;
      if (country && (!user.country || user.country === 'Unknown')) (user as any).country = country.trim();
      if (birthday) (user as any).birthday = new Date(birthday);
      await user.save({ validateModifiedOnly: true });
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

