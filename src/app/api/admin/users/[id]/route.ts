import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { getUserFromRequest } from '@/lib/auth';

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Message from '@/models/Message';
import Friendship from '@/models/Friendship';
import Group from '@/models/Group';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized: Session expired or invalid token' }, { status: 401 });

    const requester = await User.findById(payload.userId).select('role');
    if (!requester || requester.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const user = await User.findById(id).select('-password');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('[ADMIN GET USER ERROR]:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized: Session expired or invalid token' }, { status: 401 });

    const requester = await User.findById(payload.userId).select('role');
    if (!requester || requester.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check unique constraints if email or username are being updated
    if (body.email && body.email.toLowerCase() !== targetUser.email) {
      const emailExists = await User.findOne({ 
        email: body.email.toLowerCase(), 
        _id: { $ne: id } 
      });
      if (emailExists) {
        return NextResponse.json({ error: 'Email is already taken by another account' }, { status: 400 });
      }
      targetUser.email = body.email.toLowerCase();
    }

    if (body.username && body.username.toLowerCase() !== targetUser.username) {
      const cleanUsername = body.username.toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (cleanUsername.length < 3) {
        return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
      }
      const usernameExists = await User.findOne({ 
        username: cleanUsername, 
        _id: { $ne: id } 
      });
      if (usernameExists) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
      }
      targetUser.username = cleanUsername;
    }

    if (body.name !== undefined) targetUser.name = body.name.trim();
    if (body.bio !== undefined) targetUser.bio = body.bio;
    if (body.avatar !== undefined) targetUser.avatar = body.avatar;
    if (body.role !== undefined && ['user', 'admin'].includes(body.role)) {
      targetUser.role = body.role;
    }
    if (body.isVerified !== undefined) {
      targetUser.isVerified = Boolean(body.isVerified);
    }

    // If password is provided and non-empty, hash and update
    if (body.password && typeof body.password === 'string' && body.password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(12);
      targetUser.password = await bcrypt.hash(body.password.trim(), salt);
    }

    await targetUser.save();

    const sanitizedUser = targetUser.toObject();
    delete sanitizedUser.password;
    delete sanitizedUser.verificationCode;

    await AuditLog.create({
      admin: requester._id,
      action: 'USER_UPDATED',
      targetType: 'User',
      targetId: id,
      details: {
        updatedFields: Object.keys(body).filter((k) => k !== 'password'),
        passwordChanged: Boolean(body.password),
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'User updated successfully', 
      user: sanitizedUser 
    });
  } catch (error: any) {
    console.error('[ADMIN PATCH USER ERROR]:', error);
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized: Session expired or invalid token' }, { status: 401 });

    const requester = await User.findById(payload.userId).select('role');
    if (!requester || requester.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Prevent admin from deleting their own currently logged-in account
    if (payload.userId === id) {
      return NextResponse.json({ 
        error: 'You cannot delete your own administrative account while logged in.' 
      }, { status: 400 });
    }

    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found or already deleted' }, { status: 404 });
    }

    // Cascade Cleanup: Delete direct messages involving this user
    try {
      await Message.deleteMany({
        $or: [{ sender: id }, { receiver: id }],
      });
    } catch (msgErr) {
      console.warn('Cascade message delete warning:', msgErr);
    }

    // Cascade Cleanup: Delete friendships
    try {
      await Friendship.deleteMany({
        $or: [{ requester: id }, { recipient: id }],
      });
    } catch (friendErr) {
      console.warn('Cascade friendship delete warning:', friendErr);
    }

    // Cascade Cleanup: Remove user from group members
    try {
      await Group.updateMany(
        { 'members.user': id },
        { $pull: { members: { user: id } } }
      );
    } catch (grpErr) {
      console.warn('Cascade group membership cleanup warning:', grpErr);
    }

    // Permanently remove the user
    await User.findByIdAndDelete(id);

    await AuditLog.create({
      admin: requester._id,
      action: 'USER_DELETED',
      targetType: 'User',
      targetId: id,
      details: { username: userToDelete.username, email: userToDelete.email, name: userToDelete.name },
    });

    return NextResponse.json({ 
      success: true, 
      message: `User account "${userToDelete.name}" (@${userToDelete.username}) and all related records deleted successfully.` 
    });
  } catch (error: any) {
    console.error('[ADMIN DELETE USER ERROR]:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
  }
}
