import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import connectDB from './mongodb';
import User from '../models/User';
import Message from '../models/Message';

// ✅ Removed unused 'Friendship' import
// ✅ Removed unused top-level 'let io' – was shadowed by local const

export function getIO(): SocketIOServer | null {
  return (global as any).socketio || null;
}

const onlineUsers = new Map<string, Set<string>>();

export function initSocketServer(server: NetServer): SocketIOServer {
  // Return existing instance if already initialized
  if ((global as any).socketio) {
    return (global as any).socketio;
  }

  const io = new SocketIOServer(server, {
    path: '/api/socket',
    cors: {
      origin: (_origin: string | undefined, callback: Function) => {
        callback(null, true);
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    allowEIO3: true,
  });

  (global as any).socketio = io;

  // Clear stale online status on startup
  connectDB()
    .then(() =>
      User.updateMany({}, { isOnline: false })
        .then(() => console.log('🔌 Cleared online status for all users'))
        .catch((err: Error) =>
          console.error('Failed to clear online status:', err)
        )
    )
    .catch((err: Error) =>
      console.error('DB connection error on socket init:', err)
    );

  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    // ─── AUTH ──────────────────────────────────────────────────────────────
    socket.on('authenticate', async ({ userId }: { userId: string }) => {
      if (!userId) return;

      socket.data.userId = userId;
      socket.join(`user:${userId}`);

      const sockets = onlineUsers.get(userId) || new Set<string>();
      const isFirstConnection = sockets.size === 0;
      sockets.add(socket.id);
      onlineUsers.set(userId, sockets);

      if (isFirstConnection) {
        try {
          await connectDB();
          await User.findByIdAndUpdate(userId, {
            isOnline: true,
            lastSeen: new Date(),
          });
          await Message.updateMany(
            { receiver: userId, status: 'sent' },
            { status: 'delivered' }
          );
          io.emit('user_online', { userId });
          io.emit('messages_delivered', { receiverId: userId });
          console.log(`📡 User ${userId} came online`);
        } catch (err) {
          console.error(`authenticate error for ${userId}:`, err);
        }
      }

      socket.emit('authenticated', { success: true });
      console.log(`✅ User ${userId} authenticated`);
    });

    // ─── JOIN CHAT ROOM ────────────────────────────────────────────────────
    socket.on(
      'join_chat',
      ({ friendId, groupId }: { friendId?: string; groupId?: string }) => {
        const userId = socket.data.userId;
        if (!userId) return;

        if (groupId) {
          socket.join(`group:${groupId}`);
          console.log(`User ${userId} joined group room group:${groupId}`);
        } else if (friendId) {
          const room = [userId, friendId].sort().join('_');
          socket.join(room);
          console.log(`User ${userId} joined DM room ${room}`);
        }
      }
    );

    // ─── SEND MESSAGE (relay-only) ─────────────────────────────────────────
    socket.on('send_message', (_data: any) => {
      // REST API handles persistence and emits new_message
    });

    // ─── TYPING ────────────────────────────────────────────────────────────
    socket.on('typing', ({ receiverId }: { receiverId: string }) => {
      const senderId = socket.data.userId;
      if (!senderId || !receiverId) return;
      const room = [senderId, receiverId].sort().join('_');
      socket.to(room).emit('typing', { userId: senderId, isTyping: true });
    });

    socket.on('stop_typing', ({ receiverId }: { receiverId: string }) => {
      const senderId = socket.data.userId;
      if (!senderId || !receiverId) return;
      const room = [senderId, receiverId].sort().join('_');
      socket.to(room).emit('typing', { userId: senderId, isTyping: false });
    });

    // ─── READ MESSAGES ─────────────────────────────────────────────────────
    socket.on('read_messages', async ({ senderId }: { senderId: string }) => {
      const userId = socket.data.userId;
      if (!userId || !senderId) return;

      try {
        await connectDB();
        await Message.updateMany(
          { sender: senderId, receiver: userId, status: { $ne: 'read' } },
          { status: 'read' }
        );
        const room = [userId, senderId].sort().join('_');
        io.to(room).emit('messages_read', {
          readerId: userId,
          senderId,
        });
      } catch (err) {
        console.error('read_messages error:', err);
      }
    });

    // ─── CALL SIGNALING ────────────────────────────────────────────────────

    // 1. Caller → Callee: send call offer with real SDP
    socket.on(
      'call_offer',
      (data: {
        targetUserId: string;
        sdp: { type: string; sdp: string };
        callerInfo: { id: string; name: string; avatar?: string };
        callId: string;
      }) => {
        const callerId = socket.data.userId;
        if (!callerId || !data.targetUserId || !data.callId) return;

        console.log(`📞 call_offer  ${callerId} → ${data.targetUserId}  [${data.callId}]`);

        io.to(`user:${data.targetUserId}`).emit('incoming_call', {
          callId: data.callId,
          callerId,
          sdp: data.sdp,
          callerInfo: data.callerInfo,
          isGroup: false,
        });
      }
    );

    // 2. Caller → Group members: group call offer
    socket.on(
      'group_call_offer',
      (data: {
        groupId: string;
        sdp: { type: string; sdp: string };
        callerInfo: { id: string; name: string; avatar?: string };
        callId: string;
        targetUserIds: string[];
      }) => {
        const callerId = socket.data.userId;
        if (!callerId || !data.groupId || !data.callId) return;

        console.log(`📞 group_call_offer  ${callerId} → group:${data.groupId}  [${data.callId}]`);

        data.targetUserIds.forEach((uid) => {
          if (uid !== callerId) {
            io.to(`user:${uid}`).emit('incoming_call', {
              callId: data.callId,
              callerId,
              groupId: data.groupId,
              sdp: data.sdp,
              callerInfo: data.callerInfo,
              isGroup: true,
            });
          }
        });
      }
    );

    // 3. Callee → Caller: SDP answer
    socket.on(
      'call_answer',
      (data: {
        callId: string;
        callerId: string;
        sdp: { type: string; sdp: string };
      }) => {
        const answererId = socket.data.userId;
        if (!answererId || !data.callerId || !data.callId) return;

        console.log(`✅ call_answer  ${answererId} → ${data.callerId}  [${data.callId}]`);

        // ✅ Event name: 'call_answered' matches Flutter callAnsweredStream
        io.to(`user:${data.callerId}`).emit('call_answered', {
          callId: data.callId,
          answererId,
          sdp: data.sdp,
        });
      }
    );

    // 4. Callee declines
    socket.on(
      'call_decline',
      (data: { callId: string; callerId: string }) => {
        const declinerId = socket.data.userId;
        if (!declinerId || !data.callerId || !data.callId) return;

        console.log(`❌ call_decline  ${declinerId} → ${data.callerId}  [${data.callId}]`);

        // ✅ Event name: 'call_declined' matches Flutter callDeclinedStream
        io.to(`user:${data.callerId}`).emit('call_declined', {
          callId: data.callId,
          declinerId,
        });
      }
    );

    // 5. Either party ends call
    socket.on(
      'call_end',
      (data: {
        callId: string;
        targetUserId?: string;
        groupId?: string;
      }) => {
        const enderId = socket.data.userId;
        if (!enderId || !data.callId) return;

        console.log(`🔴 call_end  by ${enderId}  [${data.callId}]`);

        // ✅ Event name: 'call_ended' matches Flutter callEndedStream
        if (data.targetUserId) {
          io.to(`user:${data.targetUserId}`).emit('call_ended', {
            callId: data.callId,
            enderId,
          });
        }

        if (data.groupId) {
          io.to(`call:${data.callId}`).emit('call_ended', {
            callId: data.callId,
            enderId,
          });
        }
      }
    );

    // 6. ICE candidate relay (both directions)
    socket.on(
      'ice_candidate',
      (data: {
        callId: string;
        targetUserId: string;
        candidate: {
          candidate: string;
          sdpMid: string | null;
          sdpMLineIndex: number | null;
        };
      }) => {
        const fromUserId = socket.data.userId;
        if (!fromUserId || !data.targetUserId || !data.callId) return;

        console.log(`🧊 ice_candidate  ${fromUserId} → ${data.targetUserId}  [${data.callId}]`);

        // ✅ Relay to target user — Flutter listens on 'ice_candidate'
        io.to(`user:${data.targetUserId}`).emit('ice_candidate', {
          callId: data.callId,
          candidate: data.candidate,
          fromUserId,
        });
      }
    );

    // 7. Join group call room
    socket.on(
      'group_call_join',
      (data: { callId: string } | string) => {
        const userId = socket.data.userId;
        if (!userId) return;

        // ✅ Handle both object {callId} and raw string
        const callId =
          typeof data === 'string' ? data : (data as any).callId;
        if (!callId) return;

        socket.join(`call:${callId}`);
        socket.to(`call:${callId}`).emit('group_call_participant_joined', {
          callId,
          userId,
        });
        console.log(`👥 ${userId} joined call:${callId}`);
      }
    );

    // 8. Leave group call room
    socket.on(
      'group_call_leave',
      (data: { callId: string } | string) => {
        const userId = socket.data.userId;
        if (!userId) return;

        const callId =
          typeof data === 'string' ? data : (data as any).callId;
        if (!callId) return;

        socket.leave(`call:${callId}`);
        socket.to(`call:${callId}`).emit('group_call_participant_left', {
          callId,
          userId,
        });
        console.log(`👤 ${userId} left call:${callId}`);
      }
    );

    // ─── DISCONNECT ────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      const userId = socket.data.userId;
      if (!userId) return;

      const sockets = onlineUsers.get(userId);
      if (!sockets) return;

      sockets.delete(socket.id);

      if (sockets.size === 0) {
        onlineUsers.delete(userId);
        try {
          await connectDB();
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date(),
          });
          io.emit('user_offline', { userId });
          console.log(`📡 User ${userId} went offline`);
        } catch (err) {
          console.error(`disconnect error for ${userId}:`, err);
        }
      }
    });
  });

  console.log('✅ Socket.io server initialized');
  return io;
}

export function isUserOnline(userId: string): boolean {
  const sockets = onlineUsers.get(userId);
  return sockets !== undefined && sockets.size > 0;
}