import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

const PREMIUM_FEATURES = [
  {
    id: 'double_limits',
    icon: 'filter_2_rounded',
    title: 'Double Limits',
    description: 'Up to 1000 channels, 30 chat folders, 10 pinned chats, 20 public links, and 4 accounts.',
  },
  {
    id: '4gb_uploads',
    icon: 'cloud_upload_rounded',
    title: '4 GB Uploads',
    description: 'Send large media and documents up to 4 GB per file with zero compression issues.',
  },
  {
    id: 'faster_speed',
    icon: 'bolt_rounded',
    title: 'Faster Download Speed',
    description: 'Unlimited download and upload speeds on media and cloud storage without throttling.',
  },
  {
    id: 'voice_to_text',
    icon: 'mic_none_rounded',
    title: 'Voice-to-Text Conversion',
    description: 'Read the transcript of any incoming voice or video message with one tap.',
  },
  {
    id: 'no_ads',
    icon: 'block_rounded',
    title: 'No Ads',
    description: 'Enjoy a completely clean, ad-free experience across all channels and chats.',
  },
  {
    id: 'unique_reactions',
    icon: 'favorite_rounded',
    title: 'Unique Reactions & Emojis',
    description: 'React with infinite custom animated emojis and interactive effects.',
  },
  {
    id: 'premium_stickers',
    icon: 'auto_awesome_rounded',
    title: 'Premium Stickers',
    description: 'Exclusive stickers with full-screen dynamic animations updated monthly.',
  },
  {
    id: 'advanced_chat_management',
    icon: 'folder_special_rounded',
    title: 'Advanced Chat Management',
    description: 'Set default folder, auto-archive and hide non-contact chats easily.',
  },
  {
    id: 'profile_badge',
    icon: 'verified_rounded',
    title: 'Profile Badge & Star',
    description: 'A special star badge next to your name indicating your Premium status.',
  },
  {
    id: 'animated_avatar',
    icon: 'play_circle_outline_rounded',
    title: 'Animated Profile Pictures',
    description: 'Video avatars that loop smoothly across chat lists and profiles.',
  },
  {
    id: 'realtime_translation',
    icon: 'translate_rounded',
    title: 'Real-time Translation',
    description: 'Instant real-time translation of messages in chats and public channels.',
  },
  {
    id: 'emoji_status',
    icon: 'sentiment_satisfied_alt_rounded',
    title: 'Emoji Statuses',
    description: 'Choose an animated emoji status displayed right beside your name.',
  },
];

const PREMIUM_PLANS = [
  {
    id: 'lifetime',
    title: 'Lifetime',
    priceUsd: 59.99,
    monthlyEquivalent: 0,
    discountPercent: 60,
    isBestValue: true,
  },
  {
    id: 'annual',
    title: '12 Months',
    priceUsd: 28.99,
    monthlyEquivalent: 2.41,
    discountPercent: 40,
    isBestValue: false,
  },
  {
    id: 'monthly',
    title: '1 Month',
    priceUsd: 3.99,
    monthlyEquivalent: 3.99,
    discountPercent: 0,
    isBestValue: false,
  },
];

// GET /api/premium
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    let isPremium = false;
    let premiumExpiresAt: Date | null = null;
    let premiumPlan: string | null = null;

    if (payload?.userId) {
      const user = await User.findById(payload.userId).select('isPremium premiumExpiresAt premiumPlan');
      if (user) {
        isPremium = !!user.isPremium;
        premiumExpiresAt = user.premiumExpiresAt || null;
        premiumPlan = user.premiumPlan || null;
      }
    }

    return NextResponse.json({
      isPremium,
      premiumExpiresAt,
      premiumPlan,
      features: PREMIUM_FEATURES,
      plans: PREMIUM_PLANS,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch premium status' }, { status: 500 });
  }
}

// POST /api/premium
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const requestedPlan = body.plan?.toLowerCase();
    const plan = (requestedPlan === 'lifetime') ? 'lifetime' : (requestedPlan === 'monthly' ? 'monthly' : 'annual');

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    const expiresAt = new Date(now);
    if (plan === 'lifetime') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 100);
    } else if (plan === 'annual') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    user.isPremium = true;
    user.premiumExpiresAt = expiresAt;
    user.premiumPlan = plan;

    // Add bonus stars on subscription!
    const bonusStars = plan === 'lifetime' ? 1000 : (plan === 'annual' ? 250 : 50);
    user.starsBalance = (user.starsBalance || 0) + bonusStars;
    if (!user.starTransactions) user.starTransactions = [];
    user.starTransactions.unshift({
      id: 'sub_' + Date.now(),
      type: 'reward',
      amount: bonusStars,
      title: `Novix Premium (${plan.toUpperCase()}) Bonus`,
      description: `Received ${bonusStars} bonus Stars with your Novix Premium ${plan} plan!`,
      createdAt: new Date(),
    });

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Subscribed to Novix Premium successfully!',
      isPremium: user.isPremium,
      premiumExpiresAt: user.premiumExpiresAt,
      premiumPlan: user.premiumPlan,
      starsBalance: user.starsBalance,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to activate premium' }, { status: 500 });
  }
}
