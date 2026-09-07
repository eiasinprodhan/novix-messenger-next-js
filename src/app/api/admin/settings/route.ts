import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SystemSetting from '@/models/SystemSetting';
import AuditLog from '@/models/AuditLog';
import { getUserFromRequest } from '@/lib/auth';

const SETTINGS_KEY = 'platform_settings';

const DEFAULT_SETTINGS = {
  adminNotificationEmail: process.env.ADMIN_NOTIFY_EMAIL || process.env.GMAIL_USER || '',
  notifyOnNewUser: true,
  notifyOnNewReport: true,
  notifyOnNewGroup: false,
  allowRegistrations: true,
  maintenanceMode: false,
  systemAnnouncement: '',
};

async function verifyAdmin(request: NextRequest) {
  const decoded = getUserFromRequest(request);
  if (!decoded || decoded.role !== 'admin') {
    return null;
  }
  return decoded;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 });
    }

    await connectDB();

    let setting = await SystemSetting.findOne({ key: SETTINGS_KEY });
    if (!setting) {
      setting = await SystemSetting.create({
        key: SETTINGS_KEY,
        value: DEFAULT_SETTINGS,
      });
    }

    // Merge defaults in case new keys were added
    const merged = { ...DEFAULT_SETTINGS, ...setting.value };

    return NextResponse.json({ success: true, settings: merged });
  } catch (error: any) {
    console.error('Error fetching admin settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    let setting = await SystemSetting.findOne({ key: SETTINGS_KEY });
    const currentVal = setting?.value || DEFAULT_SETTINGS;
    const updatedVal = { ...currentVal, ...body };

    await SystemSetting.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { value: updatedVal },
      { upsert: true, new: true }
    );

    // Audit log
    await AuditLog.create({
      admin: admin.userId,
      action: 'SETTINGS_UPDATE',
      targetType: 'System',
      targetId: 'platform_settings',
      details: body,
    });

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      settings: updatedVal,
    });
  } catch (error: any) {
    console.error('Error saving admin settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
