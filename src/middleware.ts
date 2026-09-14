import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, RATE_LIMIT_PRESETS } from './lib/rateLimit';

const ALLOWED_HEADERS =
  'Content-Type, Authorization, Accept, X-Requested-With, x-device-id, x-device-name, x-device-type, x-device-os, x-device-browser';

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  const pathname = request.nextUrl.pathname;

  // 1. Handle Preflight OPTIONS requests immediately
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': ALLOWED_HEADERS,
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // 2. Client IP Resolution
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = (forwardedFor ? forwardedFor.split(',')[0].trim() : null) ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  // 3. Category-based Rate Limiting
  let category = 'general';
  if (pathname.startsWith('/api/auth/')) {
    category = 'auth';
  } else if (pathname.startsWith('/api/upload')) {
    category = 'upload';
  } else if (pathname.startsWith('/api/messages')) {
    category = 'messages';
  }

  const preset = RATE_LIMIT_PRESETS[category] || RATE_LIMIT_PRESETS.general;
  const rateLimitKey = `${category}:${ip}`;
  const rateLimitResult = checkRateLimit(rateLimitKey, preset);

  // 4. If Limit Exceeded, return HTTP 429
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please slow down.',
        retryAfter: rateLimitResult.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true',
          'Retry-After': rateLimitResult.retryAfterSeconds.toString(),
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        },
      }
    );
  }

  // 5. Normal Request Processing with Security & Performance Headers
  const response = NextResponse.next();

  // CORS Headers
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  response.headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS);

  // Rate Limit Headers
  response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

  // Modern HTTP Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
