import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomName, participantName } = await request.json();

    if (!roomName) {
      return NextResponse.json({ error: 'roomName is required' }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      console.error('[LiveKit] Missing env vars: LIVEKIT_API_KEY, LIVEKIT_API_SECRET, or LIVEKIT_URL');
      return NextResponse.json({ error: 'LiveKit is not configured' }, { status: 500 });
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

    return NextResponse.json({ token, url: livekitUrl });
  } catch (error) {
    console.error('[LiveKit] Token generation error:', error);
    return NextResponse.json({ error: 'Failed to generate call token' }, { status: 500 });
  }
}
