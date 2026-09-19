import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Ad from '@/models/Ad';
import { getUserFromRequest } from '@/lib/auth';

const DEFAULT_SEEDED_ADS = [
  {
    title: 'Promote Your Business Online - Grow with Google Ads',
    description: 'Get in front of customers when they are searching for businesses like yours on Google Search and Maps. Start today with $500 in ad credit.',
    advertiser: 'Google Ads',
    advertiserLogo: 'https://www.gstatic.com/images/branding/product/2x/google_ads_48dp.png',
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&q=80',
    ctaText: 'Sign up',
    url: 'https://ads.google.com',
    category: 'Marketing',
    isActive: true,
  },
  {
    title: 'Reach More Customers on Facebook & Instagram',
    description: 'Connect with people where they spend their time. Create targeted campaigns with powerful audience insights.',
    advertiser: 'Meta for Business',
    advertiserLogo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    ctaText: 'Learn More',
    url: 'https://facebook.com/business',
    category: 'Social Media',
    isActive: true,
  },
  {
    title: 'Supercharge Your Chats with Next-Gen Novix AI',
    description: 'Instant multi-language translation, smart voice transcription, and team automations built right into your Novix Messenger chats.',
    advertiser: 'Novix Cloud & AI',
    advertiserLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    ctaText: 'Explore AI',
    url: 'https://novix.me',
    category: 'Technology',
    isActive: true,
  },
  {
    title: 'Turn Your Ideas into a Global Online Store',
    description: 'Build your brand, sell to anyone around the world, and accept payments with zero hassle on Shopify.',
    advertiser: 'Shopify Global',
    advertiserLogo: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Shopify_logo_2018.svg',
    imageUrl: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800&q=80',
    ctaText: 'Start Free Trial',
    url: 'https://www.shopify.com',
    category: 'E-Commerce',
    isActive: true,
  },
];

const DEFAULT_ADVERTISERS = [
  {
    name: 'Google Ads',
    category: 'Search & Display Advertising',
    initials: 'G',
    colorHex: '#4285F4',
    website: 'https://ads.google.com',
  },
  {
    name: 'Meta for Business',
    category: 'Social Media Marketing',
    initials: 'M',
    colorHex: '#0866FF',
    website: 'https://facebook.com/business',
  },
  {
    name: 'Novix Cloud & AI',
    category: 'Artificial Intelligence & Productivity',
    initials: 'NX',
    colorHex: '#8E52EA',
    website: 'https://novix.me',
  },
  {
    name: 'Shopify Global',
    category: 'E-Commerce & Retail Solutions',
    initials: 'S',
    colorHex: '#00B894',
    website: 'https://www.shopify.com',
  },
];

// Helper to seed ads if collection is empty
async function ensureAdsSeeded() {
  const count = await Ad.countDocuments();
  if (count === 0) {
    await Ad.insertMany(DEFAULT_SEEDED_ADS);
  }
}

// GET /api/ads
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await ensureAdsSeeded();

    const payload = getUserFromRequest(request);

    let savedAds: any[] = [];
    let hiddenAdvertisers: string[] = [];
    let adPreferences = {
      partnerActivity: false,
      audienceBased: false,
      profileCategories: false,
      dataSharing: false,
    };

    if (payload?.userId) {
      const user = await User.findById(payload.userId).select('savedAds hiddenAdvertisers isPremium adPreferences');
      if (user) {
        if (user.adPreferences) {
          adPreferences = {
            partnerActivity: !!user.adPreferences.partnerActivity,
            audienceBased: !!user.adPreferences.audienceBased,
            profileCategories: !!user.adPreferences.profileCategories,
            dataSharing: !!user.adPreferences.dataSharing,
          };
        }
        savedAds = user.savedAds || [];
        hiddenAdvertisers = user.hiddenAdvertisers || [];

        // If user has Premium, they have no ads!
        if (user.isPremium) {
          return NextResponse.json({
            isPremiumNoAds: true,
            ads: [],
            allAds: [],
            advertisers: DEFAULT_ADVERTISERS,
            savedAds,
            hiddenAdvertisers,
            adPreferences,
          });
        }
      }
    }

    const allDbAds = await Ad.find({ isActive: true }).sort({ createdAt: -1 });
    const formattedAds = allDbAds.map((ad) => ({
      id: ad._id.toString(),
      advertiser: ad.advertiser,
      advertiserLogo: ad.advertiserLogo || '',
      title: ad.title,
      description: ad.description,
      imageUrl: ad.imageUrl || '',
      ctaText: ad.ctaText || 'Learn More',
      url: ad.url,
      category: ad.category || 'General',
      impressions: ad.impressions || 0,
      clicks: ad.clicks || 0,
    }));

    const visibleAds = formattedAds.filter((ad) => !hiddenAdvertisers.includes(ad.advertiser));

    // Asynchronously record impressions for loaded visible ads
    if (visibleAds.length > 0) {
      const adIds = visibleAds.map((a) => a.id);
      Ad.updateMany({ _id: { $in: adIds } }, { $inc: { impressions: 1 } }).catch(() => {});
    }

    // Dynamic advertisers catalog from active DB ads
    const advertisers = Array.from(new Set(allDbAds.map((a) => a.advertiser))).map((name) => {
      const match = DEFAULT_ADVERTISERS.find((d) => d.name.toLowerCase() === name.toLowerCase());
      const sample = allDbAds.find((a) => a.advertiser === name);
      return {
        name,
        category: match?.category || sample?.category || 'Sponsor',
        initials: match?.initials || name.substring(0, 2).toUpperCase(),
        colorHex: match?.colorHex || '#8E52EA',
        website: match?.website || sample?.url || 'https://novix.me',
      };
    });

    return NextResponse.json({
      isPremiumNoAds: false,
      ads: visibleAds,
      allAds: formattedAds,
      advertisers: advertisers.length > 0 ? advertisers : DEFAULT_ADVERTISERS,
      savedAds,
      hiddenAdvertisers,
      adPreferences,
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
    const { action, adId, advertiser, preferences } = body;

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'save_ad') {
      let ad = null;
      if (adId) {
        ad = await Ad.findById(adId).catch(() => null);
      }
      if (ad) {
        if (!user.savedAds) user.savedAds = [];
        if (!user.savedAds.some((s: any) => s.id === ad._id.toString())) {
          user.savedAds.unshift({
            id: ad._id.toString(),
            title: ad.title,
            advertiser: ad.advertiser,
            imageUrl: ad.imageUrl || '',
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

    if (action === 'update_preferences' && preferences) {
      user.adPreferences = {
        ...(user.adPreferences || {}),
        ...preferences,
      };
      await user.save();
      return NextResponse.json({ success: true, adPreferences: user.adPreferences });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update ads' }, { status: 500 });
  }
}
