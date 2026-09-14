import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { DraftModel } from '@/models/sqlite-models';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('targetId');

    if (targetId) {
      const draft = await DraftModel.findOne({ userId: payload.userId, targetId });
      return NextResponse.json({ draft: draft ? draft.content : '' });
    }

    const drafts = await DraftModel.find({ userId: payload.userId });
    return NextResponse.json({ drafts });
  } catch (error) {
    console.error('Drafts GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetId, content } = await request.json();
    if (!targetId) {
      return NextResponse.json({ error: 'targetId is required' }, { status: 400 });
    }

    const draft = new DraftModel({
      userId: payload.userId,
      targetId,
      content: content || '',
    });
    await draft.save();

    return NextResponse.json({ success: true, targetId, content: content || '' });
  } catch (error) {
    console.error('Drafts POST error:', error);
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
  }
}
