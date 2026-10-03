import { NextRequest } from 'next/server';

// Fast in-memory cache for IP country resolution to eliminate latency on repeated requests
const ipCountryCache = new Map<string, string>();

/**
 * Detects the user's country from the request IP address.
 */
export async function getCountryFromRequest(request: NextRequest): Promise<string> {
  try {
    // 1. Check Cloudflare header if available (instant 0ms)
    const cfCountry = request.headers.get('cf-ipcountry');
    if (cfCountry && cfCountry.length === 2 && cfCountry !== 'XX') {
      const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
      const countryName = regionNames.of(cfCountry.toUpperCase());
      if (countryName) return countryName;
    }

    // 2. Extract client IP from headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    let ip = forwardedFor ? forwardedFor.split(',')[0].trim() : (request.headers.get('x-real-ip') || '');

    // Check memory cache first (instant 0ms)
    if (ip && ipCountryCache.has(ip)) {
      return ipCountryCache.get(ip)!;
    }

    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      if (ipCountryCache.has('local')) {
        return ipCountryCache.get('local')!;
      }
      // Fast fallback lookup for local development / missing IP (max 600ms timeout)
      const res = await fetch('http://ip-api.com/json/?fields=country', {
        headers: { 'User-Agent': 'NovixMessenger/1.0' },
        signal: AbortSignal.timeout(600),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        if (data && data.country) {
          ipCountryCache.set('local', data.country);
          return data.country;
        }
      }
      return 'United States';
    }

    // 3. Lookup IP country via ip-api with fast 600ms timeout
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country`, {
      headers: { 'User-Agent': 'NovixMessenger/1.0' },
      signal: AbortSignal.timeout(600),
    }).catch(() => null);

    if (res && res.ok) {
      const data = await res.json();
      if (data && data.country) {
        ipCountryCache.set(ip, data.country);
        return data.country;
      }
    }
  } catch (e) {
    console.error('IP country resolution error:', e);
  }

  return 'United States';
}
