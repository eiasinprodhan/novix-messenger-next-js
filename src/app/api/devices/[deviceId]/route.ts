import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-device-id, x-device-name, x-device-type, x-device-os, x-device-browser',
    'Content-Type': 'application/json',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    await connectDB();
    const { deviceId } = await params;
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });

    const user = await User.findById(payload.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: corsHeaders() });

    // Remove the specified device
    user.devices = user.devices.filter((d: any) => d.deviceId !== deviceId);
    await user.save();

    return NextResponse.json({
      success: true,
      devices: user.devices,
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Logout specific device error:', error);
    return NextResponse.json({ error: 'Failed to logout device' }, { status: 500, headers: corsHeaders() });
  }
}
