import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import SystemSetting from '@/models/SystemSetting';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { sendWelcomeEmail, sendAdminNotificationEmail } from '@/lib/mailer';
import { getCountryFromRequest } from '@/lib/ipCountry';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

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
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`register:${ip}`, { limit: 6, windowMs: 60 * 1000 });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again shortly.' },
      {
        status: 429,
        headers: {
          ...corsHeaders(),
          'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    await connectDB();

    const body = await request.json();
    let { name, username, email, password, phone, gender, country, birthday } = body;

    // Auto detect country via IP if not provided
    if (!country || typeof country !== 'string' || !country.trim()) {
      country = await getCountryFromRequest(request);
    }

    if (!name || !username || !email || !password) {
      return NextResponse.json({ error: 'Name, username, email, and password are required' }, { status: 400, headers: corsHeaders() });
    }

    // Validate gender if provided
    const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
    if (gender && !validGenders.includes(gender)) {
      gender = 'prefer_not_to_say';
    }

    // Validate birthday if provided
    let birthdayDate: Date | undefined = undefined;
    if (birthday) {
      const parsed = new Date(birthday);
      if (!isNaN(parsed.getTime())) {
        const minAgeDate = new Date();
        minAgeDate.setFullYear(minAgeDate.getFullYear() - 13);
        if (parsed > minAgeDate) {
          return NextResponse.json({ error: 'You must be at least 13 years old to register' }, { status: 400, headers: corsHeaders() });
        }
        birthdayDate = parsed;
      }
    }

    const orConditions: any[] = [
      { email: email.toLowerCase() },
      { username: username.toLowerCase() }
    ];
    if (phone && String(phone).trim()) {
      const cleanDigits = String(phone).replace(/[^\d+]/g, '').trim();
      const digitsOnly = cleanDigits.replace(/\D/g, '');
      const regexPattern = digitsOnly.slice(-10);
      orConditions.push({ phone: String(phone).trim() });
      if (regexPattern.length >= 6) {
        orConditions.push({ phone: { $regex: regexPattern, $options: 'i' } });
      }
    }

    const existing = await User.findOne({ $or: orConditions });
    if (existing) {
      if (existing.email.toLowerCase() === email.toLowerCase()) {
        return NextResponse.json({ error: 'This email is already registered' }, { status: 409, headers: corsHeaders() });
      }
      if (existing.username.toLowerCase() === username.toLowerCase()) {
        return NextResponse.json({ error: 'This username is already taken' }, { status: 409, headers: corsHeaders() });
      }
      if (phone && existing.phone && existing.phone.trim()) {
        return NextResponse.json({ error: 'This phone number is already registered' }, { status: 409, headers: corsHeaders() });
      }
      return NextResponse.json({ error: 'User already exists with this email, username, or phone number' }, { status: 409, headers: corsHeaders() });
    }

    const user = await User.create({
      name: name.trim(),
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone ? String(phone).trim() : '',
      gender: gender || 'prefer_not_to_say',
      country: country ? country.trim() : '',
      birthday: birthdayDate,
      isVerified: true,
      isOnline: true,
      lastSeen: new Date(),
      lastActiveAt: new Date(),
    });

    const accessToken = generateAccessToken({ userId: user._id.toString(), email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email, role: user.role });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.name || user.username)
      .then(() => {
        console.log('>>> [REGISTER] Welcome email sent to', user.email);
      })
      .catch((emailErr: any) => {
        console.error('>>> [REGISTER] Welcome email send failed:', emailErr.message);
      });

    // Notify Administrator if enabled
    SystemSetting.findOne({ key: 'platform_settings' })
      .then((setting) => {
        const settings = setting?.value;
        const targetEmail = settings?.adminNotificationEmail || process.env.ADMIN_NOTIFY_EMAIL;
        const shouldNotify = settings?.notifyOnNewUser !== false;

        if (targetEmail && shouldNotify) {
          sendAdminNotificationEmail({
            to: targetEmail,
            subject: `New User Registration: ${user.name} (@${user.username})`,
            title: 'New User Registered',
            badgeText: 'USER REGISTRATION',
            message: `A new user account was registered on Novix Messenger.`,
            metadataItems: [
              { label: 'Full Name', value: user.name },
              { label: 'Username', value: `@${user.username}` },
              { label: 'Email Address', value: user.email },
              { label: 'Country', value: user.country || 'Unknown' },
              { label: 'Server Time', value: new Date().toUTCString() },
            ],
          }).catch((err: any) => console.error('>>> [REGISTER] Admin notification email failed:', err.message));
        }
      })
      .catch((err: any) => console.error('>>> [REGISTER] Failed to check admin settings:', err.message));

    console.log('>>> [REGISTER] SUCCESS for', user.email, '— verified & tokens generated');

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      requiresVerification: false,
      user: user.toJSON(),
      accessToken,
      refreshToken,
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
