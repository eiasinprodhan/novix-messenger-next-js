import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const payload = getUserFromRequest(request);
    
    if (payload) {
      await User.findByIdAndUpdate(payload.userId, {
        isOnline: false,
        lastSeen: new Date(),
      });
    }

    return NextResponse.json({ success: true, message: 'Logged out' });
  } catch (error) {
    return NextResponse.json({ success: true });
  }
}
