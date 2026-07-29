import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requester = await User.findById(payload.userId).select('role');
    if (!requester || requester.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const filter: any = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }
    if (role) {
      filter.role = role;
    }

    const skip = (page - 1) * limit;
    const users = await User.find(filter)
      .select('-password -verificationCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[ADMIN GET USERS ERROR]:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requester = await User.findById(payload.userId).select('role');
    if (!requester || requester.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, username, email, password, role } = await request.json();

    if (!name || !username || !email || !password) {
      return NextResponse.json({ error: 'Name, username, email, and password are required' }, { status: 400 });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email or username already exists' }, { status: 400 });
    }

    const newUser = new User({
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      role: role === 'admin' ? 'admin' : 'user',
      isVerified: true,
    });

    await newUser.save();

    await AuditLog.create({
      admin: requester._id,
      action: 'USER_CREATED',
      targetType: 'User',
      targetId: newUser._id.toString(),
      details: { username: newUser.username, role: newUser.role },
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: newUser.toJSON(),
    }, { status: 201 });
  } catch (error: any) {
    console.error('[ADMIN CREATE USER ERROR]:', error);
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
  }
}
