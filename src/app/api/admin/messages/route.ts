import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Message from '@/models/Message';
import AuditLog from '@/models/AuditLog';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const payload = getUserFromRequest(request);
    
    // Auth check
    if (payload) {
      const requester = await User.findById(payload.userId).select('role');
      if (!requester || requester.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden. Admin permission required.' }, { status: 403 });
      }
    }

    const { targetUserId, isBroadcast, content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 });
    }

    // Identify Admin Sender Account
    let adminSender = payload ? await User.findById(payload.userId) : null;
    if (!adminSender) {
      adminSender = await User.findOne({ role: 'admin' });
    }

    if (!adminSender) {
      return NextResponse.json({ error: 'No admin user found in database to send message from.' }, { status: 404 });
    }

    let sentCount = 0;
    const sentMessages = [];

    if (isBroadcast) {
      // Send to ALL users except the admin sender
      const allUsers = await User.find({ _id: { $ne: adminSender._id } }).select('_id');
      
      for (const recipient of allUsers) {
        const newMsg = new Message({
          sender: adminSender._id,
          receiver: recipient._id,
          content: content.trim(),
          type: 'text',
          status: 'sent',
        });
      await newMsg.save();
      const populatedMsg = await newMsg.populate('sender', 'name username avatar');
      sentMessages.push(populatedMsg);
      sentCount++;

      // Socket real-time emit
      try {
        const { getIO } = await import('@/lib/socket');
        const io = getIO();
        if (io) {
          io.to(`user:${recipient._id}`).emit('new_message', {
            message: populatedMsg.toObject(),
            from: adminSender._id.toString(),
          });
        }
        // Unhide chat & clear cache for recipient
        await User.findByIdAndUpdate(recipient._id, { $pull: { hiddenChats: adminSender._id } });
        try {
          const { invalidateFriendsCache, invalidateChatCache } = await import('@/lib/redis');
          await invalidateFriendsCache(recipient._id.toString());
          await invalidateChatCache(adminSender._id.toString(), recipient._id.toString());
        } catch (e) {}
      }

    await AuditLog.create({
      admin: adminSender._id,
      action: 'ADMIN_BROADCAST_MESSAGE_SENT',
      details: { totalRecipients: sentCount, contentPreview: content.substring(0, 50) },
    });

    return NextResponse.json({
      success: true,
      message: `Broadcast message sent to ${sentCount} users successfully!`,
      sentCount,
    });

  } else {
    // Single direct message to targetUserId
    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID is required for direct messaging' }, { status: 400 });
    }

    const recipientUser = await User.findById(targetUserId);
    if (!recipientUser) {
      return NextResponse.json({ error: 'Recipient user not found' }, { status: 404 });
    }

    const newMsg = new Message({
      sender: adminSender._id,
      receiver: recipientUser._id,
      content: content.trim(),
      type: 'text',
      status: 'sent',
    });

    await newMsg.save();
    const populatedMsg = await newMsg.populate('sender', 'name username avatar');

    // Real-time socket emit
    try {
      const { getIO } = await import('@/lib/socket');
      const io = getIO();
      if (io) {
        const roomId = [adminSender._id.toString(), recipientUser._id.toString()].sort().join('_');
        io.to(roomId).emit('new_message', {
          message: populatedMsg.toObject(),
          from: adminSender._id.toString(),
        });
        io.to(`user:${recipientUser._id}`).emit('new_message', {
          message: populatedMsg.toObject(),
          from: adminSender._id.toString(),
        });
      }
    } catch (e) {}

      // Unhide chat for both users and invalidate caches
      await User.findByIdAndUpdate(adminSender._id, { $pull: { hiddenChats: recipientUser._id } });
      await User.findByIdAndUpdate(recipientUser._id, { $pull: { hiddenChats: adminSender._id } });

      try {
        const { invalidateFriendsCache, invalidateChatCache } = await import('@/lib/redis');
        await invalidateFriendsCache(adminSender._id.toString());
        await invalidateFriendsCache(recipientUser._id.toString());
        await invalidateChatCache(adminSender._id.toString(), recipientUser._id.toString());
      } catch (e) {}

      await AuditLog.create({
        admin: adminSender._id,
        action: 'ADMIN_DIRECT_MESSAGE_SENT',
        targetType: 'User',
        targetId: recipientUser._id.toString(),
        details: { recipientUsername: recipientUser.username, contentPreview: content.substring(0, 50) },
      });

      return NextResponse.json({
        success: true,
        message: `Message sent to @${recipientUser.username} successfully!`,
        messageData: populatedMsg,
      });
  }


  } catch (error: any) {
    console.error('[ADMIN MESSAGE POST ERROR]:', error);
    return NextResponse.json({ error: 'Failed to send admin message', detail: error.message }, { status: 500 });
  }
}
