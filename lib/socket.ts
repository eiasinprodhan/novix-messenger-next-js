import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import connectDB from './mongodb';
import User from '../models/User';
import Message from '../models/Message';
import Friendship from '../models/Friendship';

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
    cors: { origin: '*', methods: ['GET', 'POST'] },
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
        await Message.updateMany(
          { receiver: userId, status: 'sent' },
          { status: 'delivered' }
        );

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
      await Message.updateMany(
        { sender: senderId, receiver: userId, status: { $ne: 'read' } },
        { status: 'read' }
      );

      const room = [userId, senderId].sort().join('_');
      io?.to(room).emit('messages_read', {
        readerId: userId,
        senderId: senderId,
      });
    });

    // DISCONNECT
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
