import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

const DEFAULT_OPENING_HOURS = [
  { day: 'Monday', open: '09:00', close: '18:00', isClosed: false, is24Hours: false },
  { day: 'Tuesday', open: '09:00', close: '18:00', isClosed: false, is24Hours: false },
  { day: 'Wednesday', open: '09:00', close: '18:00', isClosed: false, is24Hours: false },
  { day: 'Thursday', open: '09:00', close: '18:00', isClosed: false, is24Hours: false },
  { day: 'Friday', open: '09:00', close: '18:00', isClosed: false, is24Hours: false },
  { day: 'Saturday', open: '10:00', close: '16:00', isClosed: false, is24Hours: false },
  { day: 'Sunday', open: '00:00', close: '00:00', isClosed: true, is24Hours: false },
];

const DEFAULT_QUICK_REPLIES = [
  { id: 'qr_1', shortcut: '/hello', message: 'Hello! Thank you for reaching out. How can we help you today?' },
  { id: 'qr_2', shortcut: '/hours', message: 'Our business hours are Monday-Friday 9:00 AM - 6:00 PM, Saturday 10:00 AM - 4:00 PM.' },
  { id: 'qr_3', shortcut: '/pricing', message: 'You can view our complete service plans and pricing catalog on our website.' },
  { id: 'qr_4', shortcut: '/order', message: 'To place an order or check your order status, please provide your Order ID.' },
];

// GET /api/business
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(payload.userId).select('businessSettings name username isPremium');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const rawSettings = user.businessSettings;
    const settings = {
      ...(rawSettings || {
        location: { address: '', showOnProfile: true },
        openingHours: { enabled: false, schedule: DEFAULT_OPENING_HOURS },
        quickReplies: DEFAULT_QUICK_REPLIES,
        greetingMessage: {
          enabled: false,
          text: 'Hello! Thank you for reaching out. How can I assist you today?',
          recipients: 'all',
        },
        awayMessage: {
          enabled: false,
          text: 'I am currently away. I will get back to you as soon as possible!',
          schedule: 'outside_hours',
        },
        businessIntro: {
          title: user.name ? `${user.name} Business` : 'Welcome',
          message: 'Welcome to our official business chat! Feel free to ask any questions.',
        },
        chatbot: {
          enabled: false,
          botUsername: '',
        },
      }),
      isEnabled: user.isPremium ? true : (rawSettings?.isEnabled ?? false),
    };

    return NextResponse.json({
      success: true,
      businessSettings: settings,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch business settings' }, { status: 500 });
  }
}

// POST / PUT /api/business
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.businessSettings = {
      ...(user.businessSettings || {}),
      ...body,
      isEnabled: body.isEnabled !== undefined ? body.isEnabled : true,
    };

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Business settings saved successfully',
      businessSettings: user.businessSettings,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update business settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
