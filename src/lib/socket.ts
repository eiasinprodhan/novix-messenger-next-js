import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import connectDB from './mongodb';
import User from '../models/User';
import Message from '../models/Message';
import Friendship from '../models/Friendship';
import { invalidateFriendsCache, invalidateChatCache } from './redis';

let io: SocketIOServer | null = null;

export function getIO() {
  return (global as any).socketio || null;
}

const onlineUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

export function initSocketServer(server: NetServer) {
  if ((global as any).socketio) {
    return (global as any).socketio;
  }

  const io = new SocketIOServer(server, {
    path: '/api/socket',
    cors: {
      origin: (origin, callback) => {
        // Allow all origins in development to accommodate random local ports
        callback(null, true);
      },
      methods: ['GET', 'POST'],
      credentials: true
    },
    allowEIO3: true,
  });

  (global as any).socketio = io;

  // Reset all users' online status in DB on startup
  connectDB().then(() => {
    User.updateMany({}, { isOnline: false })
      .then(() => console.log('🔌 Cleared online status for all users in DB'))
      .catch((err) => console.error('Failed to clear online status on startup:', err));
  }).catch((err) => console.error('DB connection error on socket init:', err));

  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    // AUTH
    socket.on('authenticate', async ({ userId }: { userId: string }) => {
      if (!userId) return;

      // Set synchronously immediately to prevent subsequent event races (like join_chat)
      socket.data.userId = userId;
      socket.join(`user:${userId}`);

      const sockets = onlineUsers.get(userId) || new Set<string>();
      const isFirstConnection = sockets.size === 0;
      sockets.add(socket.id);
      onlineUsers.set(userId, sockets);

      if (isFirstConnection) {
        await connectDB();
        await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });

        // Update all messages sent to this user from 'sent' to 'delivered'
        const updateResult = await Message.updateMany(
          { receiver: userId, status: 'sent' },
          { status: 'delivered' }
        );

        await invalidateFriendsCache(userId);
        if (updateResult.modifiedCount > 0) {
          // Since status went sent->delivered, we can invalidate chat cache.
          // For simplicity, clearing friends cache is most crucial.
        }

        io?.emit('user_online', { userId });

        // Emit event to notify senders that their messages are delivered
        io?.emit('messages_delivered', { receiverId: userId });

        console.log(`📡 User ${userId} came online`);
      }

      socket.emit('authenticated', { success: true });
      console.log(`✅ User ${userId} authenticated`);
    });

    // JOIN CHAT ROOM
    socket.on('join_chat', ({ friendId, groupId }: { friendId?: string; groupId?: string }) => {
      const userId = socket.data.userId;
      if (!userId) return;

      if (groupId) {
        socket.join(`group:${groupId}`);
      } else if (friendId) {
        const room = [userId, friendId].sort().join('_');
        socket.join(room);
        console.log(`User ${userId} joined room ${room}`);
      }
    });

    // SEND MESSAGE (no DB write here — REST API saves and emits. This
    // handler is kept only as a relay for direct socket sends if needed,
    // but in this app the REST POST is the canonical send path.)
    socket.on('send_message', async (data: any) => {
      // Intentionally a no-op: the REST API POST /api/messages handles
      // persistence and emits new_message via getIO(). Doing nothing here
      // prevents double-saves and duplicate messages.
      console.log('[socket] send_message received (relay-only, REST handles persistence)');
    });

    // TYPING
    socket.on('typing', ({ receiverId }: { receiverId: string }) => {
      const senderId = socket.data.userId;
      if (!senderId) return;
      const room = [senderId, receiverId].sort().join('_');
      socket.to(room).emit('typing', { userId: senderId, isTyping: true });
    });

    socket.on('stop_typing', ({ receiverId }: { receiverId: string }) => {
      const senderId = socket.data.userId;
      if (!senderId) return;
      const room = [senderId, receiverId].sort().join('_');
      socket.to(room).emit('typing', { userId: senderId, isTyping: false });
    });

    // READ MESSAGES
    socket.on('read_messages', async ({ senderId }: { senderId: string }) => {
      const userId = socket.data.userId;
      if (!userId) return;

      await connectDB();
      const updateResult = await Message.updateMany(
        { sender: senderId, receiver: userId, status: { $ne: 'read' } },
        { status: 'read' }
      );

      if (updateResult.modifiedCount > 0) {
        await invalidateFriendsCache(userId);
        await invalidateFriendsCache(senderId);
        await invalidateChatCache(userId, senderId);
      }

      const room = [userId, senderId].sort().join('_');
      io?.to(room).emit('messages_read', {
        readerId: userId,
        senderId: senderId,
      });
    });

    // READ GROUP MESSAGES
    socket.on('read_group_messages', async ({ groupId }: { groupId: string }) => {
      const userId = socket.data.userId;
      if (!userId) return;

      await connectDB();
      await Message.updateMany(
        {
          group: groupId,
          sender: { $ne: userId },
          readBy: { $ne: userId }
        },
        {
          $addToSet: { readBy: userId }
        }
      );

      io?.to(`group:${groupId}`).emit('group_messages_read', {
        groupId,
        readerId: userId,
      });
    });

    // ─── CALL SIGNALING (LiveKit-based) ─────────────────────────────────────
    // Socket.io is now used ONLY for call notification (ring/decline/end).
    // All audio media is handled by LiveKit. The caller passes a roomName;
    // the callee joins that same LiveKit room when they answer.

    // Caller starts a 1:1 call
    socket.on('call_offer', (data: {
      targetUserId: string;
      roomName: string;
      callerInfo: { id: string; name: string; avatar?: string };
      callId: string;
    }) => {
      const callerId = socket.data.userId;
      if (!callerId) return;
      console.log(`📞 [LiveKit] call_offer from ${callerId} → ${data.targetUserId}, room: ${data.roomName}`);
      io?.to(`user:${data.targetUserId}`).emit('incoming_call', {
        callId: data.callId,
        callerId,
        roomName: data.roomName,
        callerInfo: data.callerInfo,
        isGroup: false,
      });
    });

    // Caller starts a group call
    socket.on('group_call_offer', (data: {
      groupId: string;
      roomName: string;
      callerInfo: { id: string; name: string; avatar?: string };
      callId: string;
      targetUserIds: string[];
    }) => {
      const callerId = socket.data.userId;
      if (!callerId) return;
      console.log(`📞 [LiveKit] group_call_offer from ${callerId} → group:${data.groupId}, room: ${data.roomName}`);
      data.targetUserIds.forEach((uid) => {
        if (uid !== callerId) {
          io?.to(`user:${uid}`).emit('incoming_call', {
            callId: data.callId,
            callerId,
            groupId: data.groupId,
            roomName: data.roomName,
            callerInfo: data.callerInfo,
            isGroup: true,
          });
        }
      });
    });

    // Callee answered — notify caller to connect to the LiveKit room
    socket.on('call_answer', (data: {
      callId: string;
      callerId: string;
    }) => {
      const answererId = socket.data.userId;
      if (!answererId) return;
      console.log(`✅ [LiveKit] call_answer from ${answererId} → ${data.callerId}`);
      io?.to(`user:${data.callerId}`).emit('call_answered', {
        callId: data.callId,
        answererId,
      });
    });

    // Callee declines
    socket.on('call_decline', (data: { callId: string; callerId: string }) => {
      const declinerId = socket.data.userId;
      if (!declinerId) return;
      console.log(`❌ [LiveKit] call_decline by ${declinerId}`);
      io?.to(`user:${data.callerId}`).emit('call_declined', {
        callId: data.callId,
        declinerId,
      });
    });

    // Either party ends the call
    socket.on('call_end', (data: { callId: string; targetUserId?: string; groupId?: string }) => {
      const enderId = socket.data.userId;
      if (!enderId) return;
      console.log(`🔴 [LiveKit] call_end by ${enderId}`);
      if (data.targetUserId) {
        io?.to(`user:${data.targetUserId}`).emit('call_ended', { callId: data.callId, enderId });
      }
      if (data.groupId) {
        io?.to(`group:${data.groupId}`).emit('call_ended', { callId: data.callId, enderId });
      }
    });

    // ─── DISCONNECT ──────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      const userId = socket.data.userId;
      if (userId) {
        const sockets = onlineUsers.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            onlineUsers.delete(userId);
            await connectDB();
            await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
            await invalidateFriendsCache(userId);
            io?.emit('user_offline', { userId });
            console.log(`📡 User ${userId} went offline`);
          }
        }
      }
    });
  });

  console.log('✅ Socket.io initialized');
  return io;
}

export function isUserOnline(userId: string) {
  const sockets = onlineUsers.get(userId);
  return sockets !== undefined && sockets.size > 0;
}
