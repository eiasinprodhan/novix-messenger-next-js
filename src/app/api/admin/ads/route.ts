import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import AuditLog from '@/models/AuditLog';
import { getUserFromRequest } from '@/lib/auth';

async function verifyAdmin(request: NextRequest) {
  const decoded = getUserFromRequest(request);
  if (!decoded || decoded.role !== 'admin') {
    return null;
  }
  return decoded;
}

// GET /api/admin/ads - Fetch all ad campaigns + stats
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 });
    }

    await connectDB();

    const ads = await Ad.find().sort({ createdAt: -1 });

    const totalAds = ads.length;
    const activeAds = ads.filter((a) => a.isActive).length;
    const totalImpressions = ads.reduce((acc, curr) => acc + (curr.impressions || 0), 0);
    const totalClicks = ads.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
    const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

    return NextResponse.json({
      success: true,
      stats: {
        totalAds,
        activeAds,
        pausedAds: totalAds - activeAds,
        totalImpressions,
        totalClicks,
        avgCtr: `${avgCtr}%`,
      },
      ads,
    });
  } catch (error: any) {
    console.error('Admin Ads GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch ads' }, { status: 500 });
  }
}

// POST /api/admin/ads - Create a new ad campaign
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { title, description, advertiser, advertiserLogo, imageUrl, ctaText, url, category, isActive } = body;

    if (!title || !description || !advertiser || !url) {
      return NextResponse.json({ error: 'Title, description, advertiser, and URL are required' }, { status: 400 });
    }

    const newAd = await Ad.create({
      title: title.trim(),
      description: description.trim(),
      advertiser: advertiser.trim(),
      advertiserLogo: advertiserLogo?.trim() || '',
      imageUrl: imageUrl?.trim() || '',
      ctaText: ctaText?.trim() || 'Learn More',
      url: url.trim(),
      category: category?.trim() || 'General',
      isActive: isActive !== false,
      impressions: 0,
      clicks: 0,
    });

    try {
      await AuditLog.create({
        admin: admin.userId as any,
        action: 'CREATE_AD_CAMPAIGN',
        targetType: 'Ad',
        targetId: newAd._id.toString(),
        details: `Created ad campaign '${newAd.title}' for advertiser '${newAd.advertiser}' (by ${admin.email || 'admin'})`,
      });
    } catch (_) {}

    return NextResponse.json({ success: true, ad: newAd }, { status: 201 });
  } catch (error: any) {
    console.error('Admin Ads POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create ad' }, { status: 500 });
  }
}

// PATCH /api/admin/ads - Update or toggle an ad
export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Ad ID is required' }, { status: 400 });
    }

    const updatedAd = await Ad.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!updatedAd) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }

    try {
      await AuditLog.create({
        admin: admin.userId as any,
        action: 'UPDATE_AD_CAMPAIGN',
        targetType: 'Ad',
        targetId: id,
        details: `Updated ad campaign '${updatedAd.title}' (by ${admin.email || 'admin'})`,
      });
    } catch (_) {}

    return NextResponse.json({ success: true, ad: updatedAd });
  } catch (error: any) {
    console.error('Admin Ads PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update ad' }, { status: 500 });
  }
}

// DELETE /api/admin/ads - Remove an ad
export async function DELETE(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Ad ID is required' }, { status: 400 });
    }

    const deleted = await Ad.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }

    try {
      await AuditLog.create({
        admin: admin.userId as any,
        action: 'DELETE_AD_CAMPAIGN',
        targetType: 'Ad',
        targetId: id,
        details: `Deleted ad campaign '${deleted.title}' (by ${admin.email || 'admin'})`,
      });
    } catch (_) {}

    return NextResponse.json({ success: true, message: 'Ad deleted successfully' });
  } catch (error: any) {
    console.error('Admin Ads DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete ad' }, { status: 500 });
  }
}
