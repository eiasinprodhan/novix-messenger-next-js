import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Report from '@/models/Report';
import User from '@/models/User';
import SystemSetting from '@/models/SystemSetting';
import { getUserFromRequest } from '@/lib/auth';
import { sendAdminNotificationEmail } from '@/lib/mailer';

// POST /api/reports — submit a user report
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reportedUserId, reason, message } = body;

    // ── Validate inputs ──────────────────────────────────────────
    if (!reportedUserId || !reason) {
      return NextResponse.json(
        { error: 'reportedUserId and reason are required' },
        { status: 400 }
      );
    }

    const validReasons = [
      'spam',
      'harassment',
      'hate_speech',
      'violence',
      'fake_account',
      'inappropriate_content',
      'scam',
      'other',
    ];
    if (!validReasons.includes(reason)) {
      return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
    }

    // ── Can't report yourself ────────────────────────────────────
    if (payload.userId === reportedUserId) {
      return NextResponse.json(
        { error: 'You cannot report yourself' },
        { status: 400 }
      );
    }

    // ── Reported user must exist ─────────────────────────────────
    const reportedUser = await User.findById(reportedUserId).select('_id name username');
    if (!reportedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // ── Prevent duplicate reports within 24 hours ────────────────
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await Report.findOne({
      reporter: payload.userId,
      reported: reportedUserId,
      createdAt: { $gte: oneDayAgo },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'You have already reported this user in the last 24 hours' },
        { status: 429 }
      );
    }

    // ── Create report ────────────────────────────────────────────
    const report = await Report.create({
      reporter: payload.userId,
      reported: reportedUserId,
      reason,
      message: (message || '').trim().slice(0, 500),
      status: 'pending',
    });

    // Populate for response
    await report.populate('reporter', 'name username avatar');
    await report.populate('reported', 'name username avatar');

    // Non-blocking Admin Alert Email
    SystemSetting.findOne({ key: 'platform_settings' })
      .lean()
      .then((settingDoc: any) => {
        const settings = settingDoc?.value || {};
        if (settings.adminNotificationEmail && settings.notifyOnNewReport !== false) {
          sendAdminNotificationEmail({
            to: settings.adminNotificationEmail,
            subject: `[Novix Alert] New Moderation Report: ${report.reason}`,
            title: 'Moderation Report Filed',
            badgeText: 'Action Required',
            message: `A user has filed a content moderation report that requires administrative review.`,
            metadataItems: [
              { label: 'Reason', value: report.reason },
              { label: 'Reporter', value: (report.reporter as any)?.name || 'Anonymous' },
              { label: 'Reported User', value: (report.reported as any)?.name || reportedUserId },
              { label: 'Report Details', value: report.message || 'No additional notes provided' },
              { label: 'Timestamp', value: new Date().toUTCString() },
            ],
          }).catch((mailErr: any) => {
            console.error('[Admin Report Notification Error]', mailErr);
          });
        }
      })
      .catch((err: any) => {
        console.error('[Admin Report Settings Query Error]', err);
      });

    return NextResponse.json(
      {
        success: true,
        message: 'Report submitted successfully. Our team will review it.',
        report: {
          id: report._id,
          reason: report.reason,
          message: report.message,
          status: report.status,
          createdAt: report.createdAt,
          reporter: report.reporter,
          reported: report.reported,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[POST /api/reports] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    );
  }
}

// GET /api/reports — admin only: list all reports
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can list all reports
    const requester = await User.findById(payload.userId).select('role');
    if (!requester || requester.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    const filter: any = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const reports = await Report.find(filter)
      .populate('reporter', 'name username avatar')
      .populate('reported', 'name username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Report.countDocuments(filter);

    return NextResponse.json({
      reports,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('[GET /api/reports] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
