import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-device-id, x-device-name, x-device-type, x-device-os, x-device-browser',
    'Content-Type': 'application/json',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });

    const user = await User.findById(payload.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: corsHeaders() });

    return NextResponse.json({
      success: true,
      devices: user.devices || [],
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Fetch devices error:', error);
    return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500, headers: corsHeaders() });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });

    const currentDeviceId = request.headers.get('x-device-id');
    if (!currentDeviceId) {
      return NextResponse.json({ error: 'Missing current device ID' }, { status: 400, headers: corsHeaders() });
    }

    const user = await User.findById(payload.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: corsHeaders() });

    // Keep only the current device
    const currentDevice = user.devices.find((d: any) => d.deviceId === currentDeviceId);
    user.devices = currentDevice ? [currentDevice] : [];
    await user.save();

    return NextResponse.json({
      success: true,
      devices: user.devices,
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Logout all others error:', error);
    return NextResponse.json({ error: 'Failed to logout from other devices' }, { status: 500, headers: corsHeaders() });
  }
}
