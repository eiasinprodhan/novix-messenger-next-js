import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

const SPONSORED_ADS = [
  {
    id: 'ad_google_1',
    advertiser: 'Google Ads',
    advertiserLogo: 'https://www.gstatic.com/images/branding/product/2x/google_ads_48dp.png',
    title: 'Promote Your Business Online - Grow with Google Ads',
    description: 'Get in front of customers when they are searching for businesses like yours on Google Search and Maps. Start today with $500 in ad credit.',
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&q=80',
    ctaText: 'Sign up',
    url: 'https://ads.google.com',
    category: 'Marketing',
  },
  {
    id: 'ad_meta_1',
    advertiser: 'Meta for Business',
    advertiserLogo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg',
    title: 'Reach More Customers on Facebook & Instagram',
    description: 'Connect with people where they spend their time. Create targeted campaigns with powerful audience insights.',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    ctaText: 'Learn More',
    url: 'https://facebook.com/business',
    category: 'Social Media',
  },
  {
    id: 'ad_tech_1',
    advertiser: 'Boba - AI in your messages',
    advertiserLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&q=80',
    title: 'Automate Customer Support 24/7 with Boba AI',
    description: 'Instant answers, multilingual translation, and smart replies built directly into your messenger chats.',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    ctaText: 'Try Free',
    url: 'https://novix.me/boba',
    category: 'Technology',
  },
];

// GET /api/ads
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);

    let savedAds: any[] = [];
    let hiddenAdvertisers: string[] = [];

    if (payload?.userId) {
      const user = await User.findById(payload.userId).select('savedAds hiddenAdvertisers isPremium');
      if (user) {
        // If user has Premium, they have no ads!
        if (user.isPremium) {
          return NextResponse.json({
            isPremiumNoAds: true,
            ads: [],
            savedAds: user.savedAds || [],
            hiddenAdvertisers: user.hiddenAdvertisers || [],
          });
        }
        savedAds = user.savedAds || [];
        hiddenAdvertisers = user.hiddenAdvertisers || [];
      }
    }

    const visibleAds = SPONSORED_ADS.filter((ad) => !hiddenAdvertisers.includes(ad.advertiser));

    return NextResponse.json({
      isPremiumNoAds: false,
      ads: visibleAds,
      allAds: SPONSORED_ADS,
      savedAds,
      hiddenAdvertisers,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch ads' }, { status: 500 });
  }
}

// POST /api/ads
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { action, adId, advertiser } = body; // action: 'save_ad' | 'unsave_ad' | 'hide_advertiser' | 'unhide_advertiser'

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'save_ad') {
      const ad = SPONSORED_ADS.find((a) => a.id === adId);
      if (ad) {
        if (!user.savedAds) user.savedAds = [];
        if (!user.savedAds.some((s: any) => s.id === ad.id)) {
          user.savedAds.unshift({
            id: ad.id,
            title: ad.title,
            advertiser: ad.advertiser,
            imageUrl: ad.imageUrl,
            url: ad.url,
            savedAt: new Date(),
          });
          await user.save();
        }
      }
      return NextResponse.json({ success: true, savedAds: user.savedAds });
    }

    if (action === 'unsave_ad') {
      if (user.savedAds) {
        user.savedAds = user.savedAds.filter((s: any) => s.id !== adId);
        await user.save();
      }
      return NextResponse.json({ success: true, savedAds: user.savedAds });
    }

    if (action === 'hide_advertiser' && advertiser) {
      if (!user.hiddenAdvertisers) user.hiddenAdvertisers = [];
      if (!user.hiddenAdvertisers.includes(advertiser)) {
        user.hiddenAdvertisers.push(advertiser);
        await user.save();
      }
      return NextResponse.json({ success: true, hiddenAdvertisers: user.hiddenAdvertisers });
    }

    if (action === 'unhide_advertiser' && advertiser) {
      if (user.hiddenAdvertisers) {
        user.hiddenAdvertisers = user.hiddenAdvertisers.filter((h: string) => h !== advertiser);
        await user.save();
      }
      return NextResponse.json({ success: true, hiddenAdvertisers: user.hiddenAdvertisers });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update ads' }, { status: 500 });
  }
}
