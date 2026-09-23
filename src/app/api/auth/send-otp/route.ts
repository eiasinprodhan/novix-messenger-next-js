import { NextRequest, NextResponse } from 'next/server';
import { generateOTP, sendVerificationEmail } from '@/lib/mailer';
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

interface OtpEntry {
  code: string;
  expiresAt: number;
}

// Shared global in-memory OTP store keyed by lowercase email (15-min TTL)
const otpStore: Map<string, OtpEntry> =
  (globalThis as any).__preOtpStore ||
  ((globalThis as any).__preOtpStore = new Map<string, OtpEntry>());

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`send-otp:${ip}`, { limit: 5, windowMs: 2 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many OTP requests. Please wait a moment.' },
      { status: 429, headers: corsHeaders() }
    );
  }

  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email is required.' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const code = generateOTP();
    otpStore.set(normalizedEmail, {
      code,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    console.log(`>>> [SEND-OTP] Generated code ${code} for ${normalizedEmail}`);

    // Send email via SMTP
    sendVerificationEmail(normalizedEmail, code)
      .then(() => console.log(`>>> [SEND-OTP] Sent to ${normalizedEmail}`))
      .catch((err: any) => console.error(`>>> [SEND-OTP] Email error:`, err.message));

    return NextResponse.json(
      { success: true, message: 'Verification code sent. Please check your email.' },
      { status: 200, headers: corsHeaders() }
    );
  } catch (err: any) {
    console.error('>>> [SEND-OTP] ERROR:', err);
    return NextResponse.json(
      { error: 'Failed to send OTP. Please try again.' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
