import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type')?.toLowerCase().trim();
    const value = searchParams.get('value')?.trim();

    if (!type || !value) {
      return NextResponse.json(
        { available: false, error: 'Type and value are required' },
        { status: 400, headers: corsHeaders() }
      );
    }

    return await handleCheck(type, value);
  } catch (err: any) {
    console.error('Check availability error:', err);
    return NextResponse.json(
      { available: false, error: 'Server error checking availability' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const type = body.type?.toLowerCase().trim();
    const value = body.value?.trim();

    if (!type || !value) {
      return NextResponse.json(
        { available: false, error: 'Type and value are required' },
        { status: 400, headers: corsHeaders() }
      );
    }

    return await handleCheck(type, value);
  } catch (err: any) {
    console.error('Check availability error:', err);
    return NextResponse.json(
      { available: false, error: 'Server error checking availability' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

async function handleCheck(type: string, value: string) {
  if (type === 'username') {
    const cleanUsername = value.toLowerCase().replace(/^@/, '').trim();
    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { available: false, message: 'Username must be at least 3 characters', field: 'username' },
        { status: 200, headers: corsHeaders() }
      );
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return NextResponse.json(
        { available: false, message: 'Username can only contain letters, numbers, and underscores', field: 'username' },
        { status: 200, headers: corsHeaders() }
      );
    }

    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return NextResponse.json(
        { available: false, message: 'This username is already taken', field: 'username' },
        { status: 200, headers: corsHeaders() }
      );
    }
    return NextResponse.json(
      { available: true, message: 'Username is available', field: 'username' },
      { status: 200, headers: corsHeaders() }
    );
  }

  if (type === 'email') {
    const cleanEmail = value.toLowerCase().trim();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      return NextResponse.json(
        { available: false, message: 'Please enter a valid email address', field: 'email' },
        { status: 200, headers: corsHeaders() }
      );
    }

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json(
        { available: false, message: 'This email is already registered', field: 'email' },
        { status: 200, headers: corsHeaders() }
      );
    }
    return NextResponse.json(
      { available: true, message: 'Email is available', field: 'email' },
      { status: 200, headers: corsHeaders() }
    );
  }

  if (type === 'phone') {
    // Strip non-digit and non-plus characters to compare normalized phone numbers
    const cleanDigits = value.replace(/[^\d+]/g, '').trim();
    const digitsOnly = cleanDigits.replace(/\D/g, '');
    if (digitsOnly.length < 6) {
      return NextResponse.json(
        { available: false, message: 'Phone number is too short', field: 'phone' },
        { status: 200, headers: corsHeaders() }
      );
    }

    const regexPattern = digitsOnly.slice(-10);

    const existing = await User.findOne({
      $or: [
        { phone: value.trim() },
        { phone: cleanDigits },
        { phone: { $regex: regexPattern, $options: 'i' } }
      ]
    });

    if (existing && existing.phone && existing.phone.trim().length > 0) {
      return NextResponse.json(
        { available: false, message: 'This phone number is already registered', field: 'phone' },
        { status: 200, headers: corsHeaders() }
      );
    }
    return NextResponse.json(
      { available: true, message: 'Phone number is available', field: 'phone' },
      { status: 200, headers: corsHeaders() }
    );
  }

  return NextResponse.json(
    { available: false, error: `Invalid type '${type}'. Expected 'phone', 'username', or 'email'.` },
    { status: 400, headers: corsHeaders() }
  );
}
