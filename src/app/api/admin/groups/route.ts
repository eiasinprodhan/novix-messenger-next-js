import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (payload) {
      const requester = await User.findById(payload.userId).select('role');
      if (!requester || requester.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const filter: any = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const groups = await Group.find(filter)
      .populate('createdBy', 'name username avatar role')
      .populate('members.user', 'name username avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Group.countDocuments(filter);

    return NextResponse.json({
      groups,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[ADMIN GET GROUPS ERROR]:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}
