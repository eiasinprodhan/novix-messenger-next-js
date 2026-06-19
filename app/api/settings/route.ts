import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

// GET current user settings
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(payload.userId).select(
      'notificationsEnabled lastSeenPrivacy readReceiptsEnabled typingIndicatorsEnabled'
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      settings: {
        notificationsEnabled: user.notificationsEnabled,
        lastSeenPrivacy: user.lastSeenPrivacy,
        readReceiptsEnabled: user.readReceiptsEnabled,
        typingIndicatorsEnabled: user.typingIndicatorsEnabled,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// Update settings
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      notificationsEnabled,
      lastSeenPrivacy,
      readReceiptsEnabled,
      typingIndicatorsEnabled,
    } = body;

    const updateData: any = {};
    if (notificationsEnabled !== undefined) updateData.notificationsEnabled = notificationsEnabled;
    if (lastSeenPrivacy) updateData.lastSeenPrivacy = lastSeenPrivacy;
    if (readReceiptsEnabled !== undefined) updateData.readReceiptsEnabled = readReceiptsEnabled;
    if (typingIndicatorsEnabled !== undefined) updateData.typingIndicatorsEnabled = typingIndicatorsEnabled;

    const user = await User.findByIdAndUpdate(
      payload.userId,
      updateData,
      { new: true }
    ).select('notificationsEnabled lastSeenPrivacy readReceiptsEnabled typingIndicatorsEnabled');

    return NextResponse.json({
      success: true,
      settings: {
        notificationsEnabled: user?.notificationsEnabled,
        lastSeenPrivacy: user?.lastSeenPrivacy,
        readReceiptsEnabled: user?.readReceiptsEnabled,
        typingIndicatorsEnabled: user?.typingIndicatorsEnabled,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
