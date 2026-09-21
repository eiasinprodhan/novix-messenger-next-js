import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    let validUrl: URL;
    try {
      validUrl = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(validUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NovixBot/2.0 (like NovixBot)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      return NextResponse.json({
        url: validUrl.toString(),
        domain: validUrl.hostname,
        title: validUrl.hostname,
        description: '',
      });
    }

    const html = await response.text();

    const getMeta = (prop: string) => {
      const match =
        html.match(new RegExp(`<meta[^>]*property=["']${prop}["'][^>]*content=["']([^"']*)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${prop}["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]*name=["']${prop}["'][^>]*content=["']([^"']*)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${prop}["']`, 'i'));
      return match ? match[1].trim() : null;
    };

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = getMeta('og:title') || getMeta('twitter:title') || (titleMatch ? titleMatch[1].trim() : validUrl.hostname);
    const description = getMeta('og:description') || getMeta('twitter:description') || getMeta('description') || '';
    let image = getMeta('og:image') || getMeta('twitter:image') || null;

    if (image && !image.startsWith('http')) {
      try {
        image = new URL(image, validUrl.origin).toString();
      } catch (_) {}
    }

    const siteName = getMeta('og:site_name') || validUrl.hostname.replace(/^www\./, '');
    const favicon = `https://www.google.com/s2/favicons?domain=${validUrl.hostname}&sz=64`;

    return NextResponse.json({
      url: validUrl.toString(),
      domain: siteName,
      title,
      description,
      image,
      favicon,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch link preview' }, { status: 500 });
  }
}
