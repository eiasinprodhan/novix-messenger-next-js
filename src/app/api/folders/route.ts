import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

// GET all custom chat folders for the user
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await User.findById(payload.userId).select('folders');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ folders: user.folders || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to get folders' }, { status: 500 });
  }
}

// POST / PUT: Save/replace all folders
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { folders } = await request.json();
    if (!Array.isArray(folders)) {
      return NextResponse.json({ error: 'folders must be an array' }, { status: 400 });
    }

    const user = await User.findById(payload.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    user.folders = folders;
    await user.save();

    // Notify user's other devices
    try {
      const { getIO } = await import('@/lib/socket');
      const io = getIO();
      if (io) {
        io.to(`user:${payload.userId}`).emit('folders_synced', { folders });
      }
    } catch (_) {}

    return NextResponse.json({ success: true, folders: user.folders });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update folders' }, { status: 500 });
  }
}
