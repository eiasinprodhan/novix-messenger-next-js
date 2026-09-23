import { NextRequest, NextResponse } from 'next/server';

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

// In-process OTP store shared with send-otp route via globalThis
const otpStore: Map<string, OtpEntry> =
  (globalThis as any).__preOtpStore ||
  ((globalThis as any).__preOtpStore = new Map<string, OtpEntry>());

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required.' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const entry = otpStore.get(normalizedEmail);

    console.log(`>>> [VERIFY-PRE-OTP] Checking code for ${normalizedEmail}. Expected: ${entry?.code}, Received: ${code}`);

    if (!entry) {
      return NextResponse.json(
        { error: 'No verification code found or already used. Please request a new one.' },
        { status: 404, headers: corsHeaders() }
      );
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(normalizedEmail);
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 410, headers: corsHeaders() }
      );
    }

    if (entry.code !== String(code).trim()) {
      return NextResponse.json(
        { error: 'Invalid verification code. Please check and try again.' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Correct code - consume it
    otpStore.delete(normalizedEmail);

    return NextResponse.json(
      { success: true, message: 'Email verified successfully.' },
      { status: 200, headers: corsHeaders() }
    );
  } catch (err: any) {
    console.error('>>> [VERIFY-PRE-OTP] ERROR:', err);
    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500, headers: corsHeaders() }
    );
  }
}