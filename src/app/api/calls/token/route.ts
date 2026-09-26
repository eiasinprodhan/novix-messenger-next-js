import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { getUserFromRequest } from '@/lib/auth';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-device-id',
    'Content-Type': 'application/json',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
    }

    const { roomName, participantName } = await request.json();

    if (!roomName) {
      return NextResponse.json({ error: 'roomName is required' }, { status: 400, headers: corsHeaders() });
    }

    const apiKey = process.env.LIVEKIT_API_KEY || 'APIrdq9WdcfPJbs';
    const apiSecret = process.env.LIVEKIT_API_SECRET || 'csvHgMDtCB7hwWUQylmhP7kmyOzK9YbteykzKfz94kR';
    const livekitUrl = process.env.LIVEKIT_URL || 'wss://novix-messenger-lownzwl5.livekit.cloud';

    if (!apiKey || !apiSecret || !livekitUrl) {
      console.error('[LiveKit] Missing env vars: LIVEKIT_API_KEY, LIVEKIT_API_SECRET, or LIVEKIT_URL');
      return NextResponse.json({ error: 'LiveKit is not configured' }, { status: 500, headers: corsHeaders() });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: payload.userId,
      name: participantName || payload.userId,
      ttl: '1h',
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    console.log(`[LiveKit] Token generated for user ${payload.userId} in room ${roomName}`);

    return NextResponse.json({ token, url: livekitUrl }, { status: 200, headers: corsHeaders() });
  } catch (error) {
    console.error('[LiveKit] Token generation error:', error);
    return NextResponse.json({ error: 'Failed to generate call token' }, { status: 500, headers: corsHeaders() });
  }
}
