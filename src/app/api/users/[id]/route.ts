import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Friendship from '@/models/Friendship';
import Message from '@/models/Message';
import { getUserFromRequest } from '@/lib/auth';

// GET single user profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(id).select('-password -verificationCode -verificationCodeExpires');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const friendship = await Friendship.findOne({
      $or: [
        { requester: payload.userId, recipient: id },
        { requester: id, recipient: payload.userId },
      ],
    });

    return NextResponse.json({ user, friendship });
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// Update profile (PUT)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const payload = getUserFromRequest(request);
    
    if (!payload || payload.userId !== id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, username, bio, avatar, gender, country, birthday, phone } = body;

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (username) updateData.username = username.toLowerCase().trim();
    if (phone !== undefined) updateData.phone = String(phone).trim();
    if (bio !== undefined) updateData.bio = bio.trim();
    if (avatar !== undefined) updateData.avatar = avatar; // support avatar URL
    if (gender !== undefined) {
      const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
      if (!validGenders.includes(gender)) {
        return NextResponse.json({ error: 'Invalid gender value' }, { status: 400 });
      }
      updateData.gender = gender;
    }
    if (country !== undefined) updateData.country = country.trim();
    if (birthday !== undefined) {
      const birthdayDate = new Date(birthday);
      if (isNaN(birthdayDate.getTime())) {
        return NextResponse.json({ error: 'Invalid birthday date' }, { status: 400 });
      }
      const minAgeDate = new Date();
      minAgeDate.setFullYear(minAgeDate.getFullYear() - 13);
      if (birthdayDate > minAgeDate) {
        return NextResponse.json({ error: 'You must be at least 13 years old' }, { status: 400 });
      }
      updateData.birthday = birthdayDate;
    }

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

// DELETE user (Admin only for MVP or self-delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const payload = getUserFromRequest(request);
    
    // For MVP: allow self delete or simple admin check
    // In real system you would check if payload.role === 'admin'
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow delete own account OR admin
    if (payload.userId !== id && payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Clean up related data (for MVP simplicity)
    await Friendship.deleteMany({
      $or: [{ requester: id }, { recipient: id }],
    });
    
    await Message.deleteMany({
      $or: [{ sender: id }, { receiver: id }],
    });

    await User.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'User deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
