import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Ad from '@/models/Ad';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/ads
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);

    let savedAds: any[] = [];
    let hiddenAdvertisers: string[] = [];
    let myAds: any[] = [];
    let isUserPremium = false;
    let userCountry = '';
    let userGender = '';
    let adPreferences = {
      partnerActivity: false,
      audienceBased: false,
      profileCategories: false,
      dataSharing: false,
    };

    if (payload?.userId) {
      const user = await User.findById(payload.userId).select('savedAds hiddenAdvertisers isPremium adPreferences country gender');
      if (user) {
        isUserPremium = !!user.isPremium;
        userCountry = (user.country || '').trim();
        userGender = (user.gender || '').trim();
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
      }

      // Fetch user's created ads
      const userAds = await Ad.find({ creatorId: payload.userId }).sort({ createdAt: -1 });
      const now = new Date();
      myAds = userAds.map((ad) => {
        let currentStatus = ad.status || (ad.isActive ? 'active' : 'draft');
        if (ad.activeUntil && new Date(ad.activeUntil) < now && currentStatus === 'active') {
          currentStatus = 'expired';
        }
        return {
          id: ad._id.toString(),
          title: ad.title,
          description: ad.description,
          advertiser: ad.advertiser,
          advertiserLogo: ad.advertiserLogo || '',
          imageUrl: ad.imageUrl || '',
          ctaText: ad.ctaText || 'Learn More',
          url: ad.url,
          category: ad.category || 'General',
          isActive: ad.isActive && (ad.activeUntil ? new Date(ad.activeUntil) > now : true),
          status: currentStatus,
          dailyRate: ad.dailyRate || 1,
          subscribedDays: ad.subscribedDays || 0,
          activeUntil: ad.activeUntil ? ad.activeUntil.toISOString() : null,
          adType: ad.adType || 'website',
          targetCountryType: ad.targetCountryType || 'all',
          targetCountries: ad.targetCountries || [],
          targetGender: ad.targetGender || 'all',
          impressions: ad.impressions || 0,
          clicks: ad.clicks || 0,
          createdAt: ad.createdAt,
        };
      });
    }

    // Active ads pool for sponsored messages
    // Includes both user-created (subscribed/active) ads AND admin-created ads (no creatorId)
    const now = new Date();
    const allDbAds = await Ad.find({
      isActive: true,
      status: 'active',
      $or: [
        // User-created ads: must have a valid activeUntil in the future
        { creatorId: { $exists: true, $ne: null }, activeUntil: { $gt: now } },
        // Admin-created ads: no expiry constraint (they run indefinitely until paused)
        { creatorId: { $exists: false } },
        { creatorId: null },
      ],
    }).sort({ createdAt: -1 });

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
      adType: ad.adType || 'website',
      targetCountryType: ad.targetCountryType || 'all',
      targetCountries: ad.targetCountries || [],
      targetGender: ad.targetGender || 'all',
      impressions: ad.impressions || 0,
      clicks: ad.clicks || 0,
    }));

    const visibleAds = formattedAds.filter((ad) => {
      if (hiddenAdvertisers.includes(ad.advertiser)) return false;

      // Country targeting filter (All countries vs specific countries)
      if (ad.targetCountryType === 'specific' && Array.isArray(ad.targetCountries) && ad.targetCountries.length > 0) {
        if (userCountry && !ad.targetCountries.some((c: string) => c.toLowerCase() === userCountry.toLowerCase())) {
          return false;
        }
      }

      // Gender targeting filter (All vs male vs female)
      if (ad.targetGender && ad.targetGender !== 'all') {
        if (userGender && userGender !== ad.targetGender) {
          return false;
        }
      }

      return true;
    });

    // If user has Premium, they don't see third-party ads in channels/chats
    const finalAds = isUserPremium ? [] : visibleAds;

    // Asynchronously record impressions for loaded visible ads
    if (finalAds.length > 0) {
      const adIds = finalAds.map((a) => a.id);
      Ad.updateMany({ _id: { $in: adIds } }, { $inc: { impressions: 1 } }).catch(() => {});
    }

    // Dynamic advertisers catalog from actual active DB ads
    const advertisers = Array.from(new Set(allDbAds.map((a) => a.advertiser))).map((name) => {
      const sample = allDbAds.find((a) => a.advertiser === name);
      const cleanName = (name || '').trim();
      const initials = cleanName.length > 0
        ? cleanName.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
        : 'AD';
      return {
        name: cleanName,
        category: sample?.category || 'Sponsor',
        initials,
        colorHex: '#2481CC',
        website: sample?.url || 'https://novix.me',
      };
    });

    return NextResponse.json({
      isPremiumNoAds: isUserPremium,
      ads: finalAds,
      allAds: formattedAds,
      myAds,
      advertisers,
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

    // ── CREATE NEW AD ──
    if (action === 'create_ad') {
      const {
        title,
        description,
        advertiser: advName,
        advertiserLogo,
        imageUrl,
        ctaText,
        url,
        category,
        adType,
        targetCountryType,
        targetCountries,
        targetGender,
        saveOnly,
        subscribeDays,
      } = body;

      if (!title || !description) {
        return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
      }

      const days = Number(subscribeDays) || 0;
      const willActivate = !saveOnly && days > 0;
      const activeUntil = willActivate ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : undefined;

      const newAd = await Ad.create({
        title: title.trim(),
        description: description.trim(),
        advertiser: (advName || user.name || 'Novix Sponsor').trim(),
        advertiserLogo: advertiserLogo || user.avatar || '',
        imageUrl: imageUrl || '',
        ctaText: ctaText?.trim() || 'Learn More',
        url: url?.trim() || 'https://novix.me',
        category: category?.trim() || 'General',
        isActive: willActivate,
        status: willActivate ? 'active' : 'draft',
        creatorId: user._id,
        creatorName: user.name || '',
        creatorAvatar: user.avatar || '',
        dailyRate: 1,
        subscribedDays: days,
        activeUntil: activeUntil,
        adType: adType || 'website',
        targetCountryType: targetCountryType === 'specific' ? 'specific' : 'all',
        targetCountries: Array.isArray(targetCountries) ? targetCountries : [],
        targetGender: ['male', 'female'].includes(targetGender) ? targetGender : 'all',
        impressions: 0,
        clicks: 0,
      });

      return NextResponse.json({
        success: true,
        ad: {
          id: newAd._id.toString(),
          title: newAd.title,
          description: newAd.description,
          advertiser: newAd.advertiser,
          advertiserLogo: newAd.advertiserLogo,
          imageUrl: newAd.imageUrl,
          ctaText: newAd.ctaText,
          url: newAd.url,
          category: newAd.category,
          isActive: newAd.isActive,
          status: newAd.status,
          dailyRate: newAd.dailyRate,
          subscribedDays: newAd.subscribedDays,
          activeUntil: newAd.activeUntil?.toISOString() || null,
          adType: newAd.adType,
          targetCountryType: newAd.targetCountryType,
          targetCountries: newAd.targetCountries,
          targetGender: newAd.targetGender,
          impressions: 0,
          clicks: 0,
          createdAt: newAd.createdAt,
        },
      });
    }

    // ── SUBSCRIBE / EXTEND AD DURATION ($1/DAY) ──
    if (action === 'subscribe_ad') {
      const { adId, days = 1 } = body;
      const numDays = Math.max(1, Number(days) || 1);
      const ad = await Ad.findOne({ _id: adId, creatorId: user._id });
      if (!ad) {
        return NextResponse.json({ error: 'Ad not found or unauthorized' }, { status: 404 });
      }

      const currentExpiry =
        ad.activeUntil && new Date(ad.activeUntil) > new Date()
          ? new Date(ad.activeUntil).getTime()
          : Date.now();
      const newExpiry = new Date(currentExpiry + numDays * 24 * 60 * 60 * 1000);

      ad.isActive = true;
      ad.status = 'active';
      ad.activeUntil = newExpiry;
      ad.subscribedDays = (ad.subscribedDays || 0) + numDays;
      await ad.save();

      return NextResponse.json({
        success: true,
        ad: {
          id: ad._id.toString(),
          status: ad.status,
          isActive: ad.isActive,
          activeUntil: ad.activeUntil.toISOString(),
          subscribedDays: ad.subscribedDays,
        },
        message: `Ad successfully subscribed for ${numDays} day(s) at $1/day!`,
      });
    }

    // ── TOGGLE STATUS (PAUSE / RESUME ANYTIME) ──
    if (action === 'toggle_status') {
      const { adId, pause } = body;
      const ad = await Ad.findOne({ _id: adId, creatorId: user._id });
      if (!ad) {
        return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
      }

      if (pause) {
        ad.isActive = false;
        ad.status = 'paused';
      } else {
        ad.isActive = true;
        ad.status = 'active';
        if (!ad.activeUntil || new Date(ad.activeUntil) <= new Date()) {
          ad.activeUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
          ad.subscribedDays = (ad.subscribedDays || 0) + 1;
        }
      }
      await ad.save();

      return NextResponse.json({
        success: true,
        ad: {
          id: ad._id.toString(),
          status: ad.status,
          isActive: ad.isActive,
          activeUntil: ad.activeUntil?.toISOString() || null,
        },
      });
    }

    // ── UPDATE AD DETAILS ──
    if (action === 'update_ad') {
      const {
        adId,
        title,
        description,
        advertiser: advName,
        imageUrl,
        ctaText,
        url,
        category,
        targetCountryType,
        targetCountries,
        targetGender,
      } = body;
      const ad = await Ad.findOne({ _id: adId, creatorId: user._id });
      if (!ad) {
        return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
      }
      if (title) ad.title = title.trim();
      if (description) ad.description = description.trim();
      if (advName) ad.advertiser = advName.trim();
      if (imageUrl !== undefined) ad.imageUrl = imageUrl;
      if (ctaText) ad.ctaText = ctaText.trim();
      if (url) ad.url = url.trim();
      if (category) ad.category = category.trim();
      if (targetCountryType !== undefined) ad.targetCountryType = targetCountryType === 'specific' ? 'specific' : 'all';
      if (targetCountries !== undefined && Array.isArray(targetCountries)) ad.targetCountries = targetCountries;
      if (targetGender !== undefined) ad.targetGender = ['male', 'female'].includes(targetGender) ? targetGender : 'all';
      await ad.save();
      return NextResponse.json({ success: true, ad });
    }

    // ── DELETE AD ──
    if (action === 'delete_ad') {
      const { adId } = body;
      const deleted = await Ad.findOneAndDelete({ _id: adId, creatorId: user._id });
      if (!deleted) {
        return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Ad deleted successfully' });
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

    // ── RECORD AD CLICK ──
    if (action === 'record_click' || action === 'click') {
      const targetId = body.adId || body.id;
      if (targetId) {
        await Ad.findByIdAndUpdate(targetId, { $inc: { clicks: 1 } }).catch(() => {});
      }
      return NextResponse.json({ success: true });
    }

    // ── RECORD AD IMPRESSION ──
    if (action === 'record_impression' || action === 'impression') {
      const targetId = body.adId || body.id;
      if (targetId) {
        await Ad.findByIdAndUpdate(targetId, { $inc: { impressions: 1 } }).catch(() => {});
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update ads' }, { status: 500 });
  }
}
