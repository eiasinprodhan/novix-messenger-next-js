import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { sendAdminNotificationEmail } from '@/lib/mailer';

async function verifyAdmin(request: NextRequest) {
  const decoded = getUserFromRequest(request);
  if (!decoded || decoded.role !== 'admin') {
    return null;
  }
  return decoded;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 });
    }

    const { targetEmail } = await request.json();
    if (!targetEmail || typeof targetEmail !== 'string' || !targetEmail.includes('@')) {
      return NextResponse.json({ error: 'Valid destination email is required' }, { status: 400 });
    }

    await sendAdminNotificationEmail({
      to: targetEmail.trim(),
      subject: 'Test Notification Alert',
      title: 'Email Delivery Test Successful',
      badgeText: 'DIAGNOSTIC TEST',
      message: 'This is a test notification from your Novix Messenger Admin Console. Your email alert integration is operational and ready to deliver real-time system events.',
      metadataItems: [
        { label: 'Triggered By', value: admin.email || 'Admin' },
        { label: 'Environment', value: process.env.NODE_ENV || 'development' },
        { label: 'Server Time', value: new Date().toUTCString() },
        { label: 'Mail Service', value: 'Gmail SMTP' },
      ],
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${targetEmail}`,
    });
  } catch (error: any) {
    console.error('Error sending test notification email:', error);
    return NextResponse.json({
      error: 'Failed to send test email',
      detail: error?.message || 'Check your SMTP credentials in .env',
    }, { status: 500 });
  }
}
