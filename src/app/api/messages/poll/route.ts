import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import Group from '@/models/Group';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { messageId, optionId } = await request.json();
    if (!messageId || !optionId) {
      return NextResponse.json({ error: 'messageId and optionId are required' }, { status: 400 });
    }

    const message = await Message.findById(messageId);
    if (!message || message.isDeleted || message.type !== 'poll' || !message.poll) {
      return NextResponse.json({ error: 'Poll message not found' }, { status: 404 });
    }

    if (message.poll.isClosed) {
      return NextResponse.json({ error: 'This poll is closed' }, { status: 400 });
    }

    // Verify participation
    if (message.group) {
      const group = await Group.findById(message.group);
      if (!group || !group.members.some((m: any) => (m.user?._id || m.user || m)?.toString() === payload.userId)) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
    } else {
      const isParticipant = [message.sender.toString(), message.receiver?.toString() || ''].includes(payload.userId);
      if (!isParticipant) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
    }

    const userIdStr = payload.userId;
    const allowMultiple = Boolean(message.poll.allowMultiple);

    // Find the target option
    const targetOption = message.poll.options.find((opt: any) => opt.id === optionId);
    if (!targetOption) {
      return NextResponse.json({ error: 'Option not found' }, { status: 404 });
    }

    const userAlreadyVotedThisOption = targetOption.votes.some((v: any) => v.toString() === userIdStr);

    if (userAlreadyVotedThisOption) {
      // Retract vote
      targetOption.votes = targetOption.votes.filter((v: any) => v.toString() !== userIdStr);
    } else {
      // If single choice, remove vote from all other options first
      if (!allowMultiple) {
        message.poll.options.forEach((opt: any) => {
          opt.votes = opt.votes.filter((v: any) => v.toString() !== userIdStr);
        });
      }
      targetOption.votes.push(userIdStr as any);
    }

    message.markModified('poll');
    await message.save();

    // Broadcast poll update
    try {
      const { getIO } = await import('@/lib/socket');
      const io = getIO();
      if (io) {
        const roomId = message.group
          ? `group:${message.group.toString()}`
          : [message.sender.toString(), message.receiver?.toString() || ''].sort().join('_');

        io.to(roomId).emit('poll_voted', {
          messageId: message._id.toString(),
          poll: message.poll,
          userId: payload.userId,
        });
      }
    } catch (_) {}

    return NextResponse.json({ success: true, poll: message.poll });
  } catch (error) {
    console.error('Poll vote error:', error);
    return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 });
  }
}
