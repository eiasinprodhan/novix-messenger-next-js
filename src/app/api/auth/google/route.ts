import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/mailer';
import { OAuth2Client } from 'google-auth-library';
import { getCountryFromRequest } from '@/lib/ipCountry';

const GOOGLE_PROJECT_NUMBER = '342549118730';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-device-id, x-device-name, x-device-type, x-device-os, x-device-browser',
    'Content-Type': 'application/json',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

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

    // Fast synchronous check for country from input or Cloudflare header (0ms overhead)
    let safeCountry: string | undefined = country && typeof country === 'string' && country.trim() ? country.trim() : undefined;
    if (!safeCountry) {
      const cfCountry = request.headers.get('cf-ipcountry');
      if (cfCountry && cfCountry.length === 2 && cfCountry !== 'XX') {
        const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
        safeCountry = regionNames.of(cfCountry.toUpperCase()) || undefined;
      }
    }

    let verifiedEmail: string | null = null;
    let verifiedName: string | null = null;
    let verifiedGoogleId: string | null = null;
    let verifiedPicture: string | null = null;

    // Comprehensive list of all client IDs across Web, iOS, and all Android keystores
    const allowedAudiences = [
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID,
      process.env.GOOGLE_ANDROID_UPLOAD_CLIENT_ID,
      process.env.GOOGLE_ANDROID_PLAY_CLIENT_ID,
      process.env.GOOGLE_IOS_CLIENT_ID,
      '342549118730-cas5qac4gl2mf0b6qg2vfqmobe8uuu9g.apps.googleusercontent.com', // Web Client ID (serverClientId)
      '342549118730-bhk6chihuvkhltv7fj3t4u388io6uctm.apps.googleusercontent.com', // Android Upload Keystore
      '342549118730-i4im7pp1maa4vji8ve0p3973lm8gjrk8.apps.googleusercontent.com', // Android Debug Keystore
      '342549118730-el3sn8cqufrueerfihk6huu0mido0gt3.apps.googleusercontent.com', // Android Google Play Store Signing
      '342549118730-is1hehfod9agq91mah9rj4doddttu52b.apps.googleusercontent.com', // Previous Play Client ID
      '342549118730-pj69d79gb39scjog35bi75v43odda3n0.apps.googleusercontent.com', // Legacy Client ID
    ].filter((id): id is string => Boolean(id && id.trim()));

    const isProjectClient = (aud?: string | null, azp?: string | null): boolean => {
      if (aud && (allowedAudiences.includes(aud) || aud.startsWith(`${GOOGLE_PROJECT_NUMBER}-`))) {
        return true;
      }
      if (azp && (allowedAudiences.includes(azp) || azp.startsWith(`${GOOGLE_PROJECT_NUMBER}-`))) {
        return true;
      }
      return false;
    };

    // ─── 1. Primary verification: google-auth-library verifyIdToken ────────────
    if (idToken) {
      try {
        // Attempt strict verification with allowed audiences
        const ticket = await client.verifyIdToken({
          idToken,
          audience: allowedAudiences,
        });
        const payload = ticket.getPayload();
        if (payload?.email) {
          verifiedEmail = payload.email.toLowerCase();
          verifiedName = payload.name || null;
          verifiedGoogleId = payload.sub || (payload as any).user_id || null;
          verifiedPicture = payload.picture || null;
          console.log('>>> [GOOGLE-AUTH] Successfully verified via client.verifyIdToken (strict audience)');
        }
      } catch (verifyErr: any) {
        console.warn('>>> [GOOGLE-AUTH] client.verifyIdToken strict audience failed:', verifyErr.message);

        // Fallback: Verify cryptographic signature first, then check project audience/azp
        try {
          const ticketAnyAud = await client.verifyIdToken({ idToken });
          const payload = ticketAnyAud.getPayload();
          if (payload?.email && isProjectClient(payload.aud, (payload as any).azp)) {
            verifiedEmail = payload.email.toLowerCase();
            verifiedName = payload.name || null;
            verifiedGoogleId = payload.sub || (payload as any).user_id || null;
            verifiedPicture = payload.picture || null;
            console.log('>>> [GOOGLE-AUTH] Successfully verified via client.verifyIdToken (project match)');
          }
        } catch (innerErr: any) {
          console.warn('>>> [GOOGLE-AUTH] client.verifyIdToken project match check failed:', innerErr.message);
        }
      }

      // ─── 2. Secondary fallback: Google tokeninfo HTTP endpoint ──────────────
      if (!verifiedEmail) {
        try {
          const tokenInfoRes = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
            { signal: AbortSignal.timeout(6000) }
          );
          if (tokenInfoRes.ok) {
            const tokenInfo = await tokenInfoRes.json();
            const isEmailVerified = tokenInfo.email_verified === 'true' || tokenInfo.email_verified === true;
            if (tokenInfo.email && (isEmailVerified || isProjectClient(tokenInfo.aud, tokenInfo.azp))) {
              verifiedEmail = tokenInfo.email.toLowerCase();
              verifiedName = tokenInfo.name || tokenInfo.given_name || null;
              verifiedGoogleId = tokenInfo.sub || tokenInfo.user_id || null;
              verifiedPicture = tokenInfo.picture || null;
              console.log('>>> [GOOGLE-AUTH] Successfully verified via Google tokeninfo endpoint');
            }
          }
        } catch (tokenInfoErr: any) {
          console.error('>>> [GOOGLE-AUTH] tokeninfo fallback failed:', tokenInfoErr.message);
        }
      }
    }

    // ─── 3. Tertiary fallback: Google OAuth2 userinfo using googleAccessToken ──
    if (!verifiedEmail && googleAccessToken) {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${googleAccessToken}` },
          signal: AbortSignal.timeout(6000),
        });
        if (userInfoRes.ok) {
          const userInfo = await userInfoRes.json();
          if (userInfo.email) {
            verifiedEmail = userInfo.email.toLowerCase();
            verifiedName = userInfo.name || null;
            verifiedGoogleId = userInfo.sub || userInfo.id || null;
            verifiedPicture = userInfo.picture || null;
            console.log('>>> [GOOGLE-AUTH] Successfully verified via Google OAuth userinfo endpoint');
          }
        }
      } catch (userInfoErr: any) {
        console.error('>>> [GOOGLE-AUTH] userinfo verification error:', userInfoErr.message);
      }
    }

    // If verifiedGoogleId is still missing but email was verified, construct fallback googleId
    if (verifiedEmail && !verifiedGoogleId) {
      verifiedGoogleId = `google_${verifiedEmail}`;
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

    // Sanitize gender to strictly match Mongoose enum
    const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'] as const;
    type GenderType = typeof validGenders[number];
    const safeGender: GenderType | undefined = gender && typeof gender === 'string' && (validGenders as readonly string[]).includes(gender.trim().toLowerCase())
      ? (gender.trim().toLowerCase() as GenderType)
      : undefined;

    // Sanitize birthday
    const safeBirthday = birthday && !isNaN(new Date(birthday).getTime()) ? new Date(birthday) : undefined;

    // Check if user exists by googleId first
    let user: any = await User.findOne({ googleId });
    let requiresProfileCompletion = false;

    if (!user) {
      // Check if user exists by email
      user = await User.findOne({ email });

      if (user) {
        // Link googleId to existing user safely
        const updateDoc: any = {
          googleId,
          isVerified: true,
          isOnline: true,
          lastSeen: new Date(),
          lastActiveAt: new Date(),
        };
        if (!user.avatar && picture) updateDoc.avatar = picture;
        if (safeGender && !user.gender) updateDoc.gender = safeGender;
        if (safeCountry && (!user.country || user.country === 'Unknown')) updateDoc.country = safeCountry;
        if (safeBirthday && !user.birthday) updateDoc.birthday = safeBirthday;

        user = await User.findByIdAndUpdate(user._id, { $set: updateDoc }, { new: true });
      } else {
        // Create new user with unique username
        const sanitized = (email.split('@')[0] || 'user').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
        let baseUsername = sanitized.length >= 3 ? sanitized.slice(0, 24) : `${sanitized}user`.slice(0, 24);
        if (baseUsername.length < 3) baseUsername = 'user';

        let username = baseUsername;
        let suffix = 1;
        while (await User.findOne({ username })) {
          username = `${baseUsername.slice(0, 20)}${suffix}`.toLowerCase();
          suffix++;
        }

        if (!safeCountry) {
          safeCountry = await getCountryFromRequest(request);
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
          country: safeCountry || 'United States',
          ...(safeGender && { gender: safeGender }),
          ...(safeBirthday && { birthday: safeBirthday }),
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
      // User exists with googleId, update online status and active time
      const updateDoc: any = {
        isOnline: true,
        lastSeen: new Date(),
        lastActiveAt: new Date(),
      };
      if (picture && (!user.avatar || user.avatar.includes('googleusercontent.com'))) {
        updateDoc.avatar = picture;
      }
      if (safeGender && !user.gender) updateDoc.gender = safeGender;
      if (safeCountry && (!user.country || user.country === 'Unknown')) updateDoc.country = safeCountry;
      if (safeBirthday && !user.birthday) updateDoc.birthday = safeBirthday;

      user = await User.findByIdAndUpdate(user._id, { $set: updateDoc }, { new: true });
    }

    if (!user) {
      return NextResponse.json({ error: 'Failed to authenticate user profile' }, { status: 500, headers: corsHeaders() });
    }

    // Register/update device activity in background
    const deviceId = request.headers.get('x-device-id');
    if (deviceId) {
      import('@/lib/device').then(({ updateDeviceActivity }) => {
        updateDeviceActivity(user._id.toString(), request).catch(() => {});
      }).catch(() => {});
    }

    // Check if core profile fields are missing
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
    return NextResponse.json({ error: 'Google login failed: ' + (error.message || 'Server error') }, { status: 500, headers: corsHeaders() });
  }
}


