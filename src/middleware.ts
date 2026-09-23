import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_HEADERS =
  'Content-Type, Authorization, Accept, X-Requested-With, x-device-id, x-device-name, x-device-type, x-device-os, x-device-browser';

// Validate allowed origins safely for CORS
function isOriginAllowed(origin: string): boolean {
  if (!origin || origin === 'null') return true;
  try {
    const url = new URL(origin);
    const host = url.hostname;
    // Allow localhost, local network IPs, cloudflare tunnels, and production hosts
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === 'novixmessenger.online' ||
      host.endsWith('.novixmessenger.online') ||
      host.endsWith('.trycloudflare.com') ||
      host.endsWith('.onrender.com') ||
      /^192\.168\.\d+\.\d+$/.test(host) ||
      /^10\.\d+\.\d+\.\d+$/.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(host)
    ) {
      return true;
    }
  } catch (_) {}
  return false;
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  const allowed = isOriginAllowed(origin);
  const allowOrigin = allowed ? origin : '*';

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Credentials': allowed ? 'true' : 'false',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': ALLOWED_HEADERS,
        'Access-Control-Max-Age': '86400',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    });
  }

  // Handle normal requests
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', allowOrigin);
  response.headers.set('Access-Control-Allow-Credentials', allowed ? 'true' : 'false');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  response.headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS);

  // Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
