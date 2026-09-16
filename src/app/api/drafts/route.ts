import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

// GET all drafts for the authenticated user
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await User.findById(payload.userId).select('drafts');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const draftsObj: Record<string, string> = {};
    if (user.drafts) {
      if (user.drafts instanceof Map) {
        user.drafts.forEach((v: string, k: string) => {
          draftsObj[k] = v;
        });
      } else {
        Object.assign(draftsObj, user.drafts);
      }
    }

    return NextResponse.json({ drafts: draftsObj });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to get drafts' }, { status: 500 });
  }
}

// POST: Save or clear draft for a specific chatId
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { chatId, draft } = await request.json();
    if (!chatId) return NextResponse.json({ error: 'chatId is required' }, { status: 400 });

    const user = await User.findById(payload.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (!user.drafts) {
      user.drafts = new Map<string, string>();
    }

    if (!draft || !draft.trim()) {
      user.drafts.delete(chatId);
    } else {
      user.drafts.set(chatId, draft);
    }

    await user.save();

    // Broadcast draft sync to all sessions of this user
    try {
      const { getIO } = await import('@/lib/socket');
      const io = getIO();
      if (io) {
        io.to(`user:${payload.userId}`).emit('draft_synced', {
          chatId,
          draft: draft || '',
        });
      }
    } catch (_) {}

    return NextResponse.json({ success: true, chatId, draft: draft || '' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to save draft' }, { status: 500 });
  }
}
