import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (_) {}

import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import connectDB from './mongodb';
import User from '../models/User';
import Message from '../models/Message';
import Friendship from '../models/Friendship';
import { invalidateFriendsCache, invalidateChatCache } from './redis';
import { messaging } from './firebase-admin';

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

      // Automatically join all active groups for this user so they receive real-time messages anywhere
      try {
        await connectDB();
        const Group = (await import('../models/Group')).default;
        const userGroups = await Group.find({
          'members.user': userId,
          isActive: true,
        }).select('_id');
        for (const g of userGroups) {
          socket.join(`group:${g._id.toString()}`);
        }
        if (userGroups.length > 0) {
          console.log(`👥 Joined ${userGroups.length} group rooms for user ${userId}`);
        }
      } catch (err) {
        console.error('Failed to auto-join groups on socket auth:', err);
      }
    });

    // JOIN CHAT ROOM
    socket.on('join_chat', ({ friendId, groupId, userId: clientUserId }: { friendId?: string; groupId?: string; userId?: string }) => {
      const userId = socket.data.userId || clientUserId;
      if (!userId) return;
      socket.data.userId = userId;

      if (groupId) {
        socket.join(`group:${groupId}`);
        console.log(`User ${userId} joined room group:${groupId}`);
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

    // THEME CHANGE
    socket.on('theme_change', async (data: { friendId?: string; groupId?: string; themeId: string; themeType: String; themeName: string }) => {
      const senderId = socket.data.userId;
      if (!senderId) return;

      try {
        await connectDB();
        const User = (await import('@/models/User')).default;
        const Message = (await import('@/models/Message')).default;
        const senderUser = await User.findById(senderId);
        const senderName = senderUser?.name || 'Someone';

        const themeName = data.themeName || 'Default';
        const isDefault = data.themeId === 'default' || themeName === 'Default';
        const actionText = isDefault ? 'disabled the chat theme' : `changed the chat theme to ${themeName}`;

        let systemMsgContent = `${senderName} ${actionText}`;

        if (data.groupId) {
          const groupRoom = `group:${data.groupId}`;
          // Save system message to DB
          const sysMsg = await Message.create({
            sender: senderId,
            group: data.groupId,
            content: systemMsgContent,
            type: 'system',
            status: 'sent',
            readBy: [senderId],
          });
          const populated = await sysMsg.populate('sender', 'name username avatar');

          io.to(groupRoom).emit('theme_changed', {
            groupId: data.groupId,
            themeId: data.themeId,
            themeType: data.themeType,
            themeName: data.themeName,
            changedBy: senderId,
            changedByName: senderName,
          });

          io.to(groupRoom).emit('new_group_message', {
            message: populated.toObject(),
            groupId: data.groupId,
          });
        } else if (data.friendId) {
          const room = [senderId, data.friendId].sort().join('_');
          // Save system message to DB
          const sysMsg = await Message.create({
            sender: senderId,
            receiver: data.friendId,
            content: systemMsgContent,
            type: 'system',
            status: 'sent',
          });
          const populated = await sysMsg.populate('sender', 'name username avatar');

          io.to(room).emit('theme_changed', {
            friendId: data.friendId,
            themeId: data.themeId,
            themeType: data.themeType,
            themeName: data.themeName,
            changedBy: senderId,
            changedByName: senderName,
          });

          io.to(room).emit('new_message', {
            message: populated.toObject(),
            from: senderId,
          });
          io.to(`user:${data.friendId}`).emit('new_message', {
            message: populated.toObject(),
            from: senderId,
          });
        }
      } catch (err) {
        console.error('Error handling theme_change event:', err);
      }
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

    // GROUP TYPING
    socket.on('group_typing', ({ groupId, isTyping }: { groupId: string; isTyping: boolean }) => {
      const senderId = socket.data.userId;
      if (!senderId || !groupId) return;
      socket.to(`group:${groupId}`).emit('group_typing', {
        groupId,
        userId: senderId,
        isTyping: Boolean(isTyping),
      });
    });

    socket.on('stop_group_typing', ({ groupId }: { groupId: string }) => {
      const senderId = socket.data.userId;
      if (!senderId || !groupId) return;
      socket.to(`group:${groupId}`).emit('group_typing', {
        groupId,
        userId: senderId,
        isTyping: false,
      });
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
    socket.on('call_offer', async (data: {
      targetUserId: string;
      roomName: string;
      callerInfo: { id: string; name: string; avatar?: string };
      callId: string;
    }) => {
      const callerId = socket.data.userId;
      if (!callerId) return;
      console.log(`📞 [LiveKit] call_offer from ${callerId} → ${data.targetUserId}, room: ${data.roomName}`);

      const incomingCallPayload = {
        callId: data.callId,
        callerId,
        roomName: data.roomName,
        callerInfo: data.callerInfo,
        isGroup: false,
      };

      // Emit via socket (for online users)
      io?.to(`user:${data.targetUserId}`).emit('incoming_call', incomingCallPayload);

      // Send FCM push to ensure delivery if backgrounded/locked
      if (messaging) {
        try {
          await connectDB();
          const targetUser = await User.findById(data.targetUserId).select('fcmToken').lean();
          if (targetUser?.fcmToken) {
            await messaging.send({
              token: targetUser.fcmToken,
              data: {
                type: 'incoming_call',
                callId: data.callId,
                callerId,
                roomName: data.roomName,
                callerName: data.callerInfo.name,
                callerAvatar: data.callerInfo.avatar ?? '',
              },
              android: {
                priority: 'high',
                ttl: 30000, // 30s — call expires
              },
              apns: {
                headers: { 'apns-priority': '10' },
                payload: {
                  aps: {
                    contentAvailable: true,
                    sound: 'ringtone.mp3',
                  },
                },
              },
            });
            console.log(`[FCM] Call notification sent to user ${data.targetUserId}`);
          }
        } catch (e) {
          console.error('[FCM] Failed to send call notification:', e);
        }
      }
    });

    // Caller starts a group call
    socket.on('group_call_offer', async (data: {
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

      // Send FCM push to all target users so devices wake up if closed/backgrounded
      if (messaging && data.targetUserIds && data.targetUserIds.length > 0) {
        try {
          await connectDB();
          const targetUsers = await User.find({
            _id: { $in: data.targetUserIds.filter((id) => id !== callerId) },
            fcmToken: { $exists: true, $ne: '' }
          }).select('_id fcmToken').lean();

          for (const u of targetUsers) {
            if (u.fcmToken) {
              messaging.send({
                token: u.fcmToken,
                data: {
                  type: 'incoming_call',
                  callId: data.callId,
                  callerId,
                  groupId: data.groupId,
                  roomName: data.roomName,
                  callerName: data.callerInfo.name,
                  callerAvatar: data.callerInfo.avatar ?? '',
                  isGroup: 'true',
                },
                android: {
                  priority: 'high',
                  ttl: 30000,
                },
                apns: {
                  headers: { 'apns-priority': '10' },
                  payload: {
                    aps: {
                      contentAvailable: true,
                      sound: 'ringtone.mp3',
                    },
                  },
                },
              }).catch((err) => console.error(`[FCM] Failed to send group call push to ${u._id}:`, err));
            }
          }
        } catch (e) {
          console.error('[FCM] Failed group_call_offer push processing:', e);
        }
      }
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
    socket.on('call_decline', async (data: { callId: string; callerId: string }) => {
      const declinerId = socket.data.userId;
      if (!declinerId) return;
      console.log(`❌ [LiveKit] call_decline by ${declinerId}`);
      io?.to(`user:${data.callerId}`).emit('call_declined', {
        callId: data.callId,
        declinerId,
      });
      // Send call_ended FCM to caller in case their app backgrounded
      await sendCallEndedFCM(data.callerId, data.callId);
    });

    // Either party ends the call
    socket.on('call_end', async (data: { callId: string; targetUserId?: string; groupId?: string }) => {
      const enderId = socket.data.userId;
      if (!enderId) return;
      console.log(`🔴 [LiveKit] call_end by ${enderId}`);
      if (data.targetUserId) {
        io?.to(`user:${data.targetUserId}`).emit('call_ended', { callId: data.callId, enderId });
        await sendCallEndedFCM(data.targetUserId, data.callId);
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

export async function sendCallEndedFCM(targetUserId: string, callId: string) {
  if (!messaging || !targetUserId) return;
  try {
    await connectDB();
    const user = await User.findById(targetUserId).select('fcmToken').lean();
    if (user?.fcmToken) {
      await messaging.send({
        token: user.fcmToken,
        data: {
          type: 'call_ended',
          callId,
        },
        android: {
          priority: 'high',
        },
        apns: {
          headers: { 'apns-priority': '10' },
          payload: {
            aps: {
              contentAvailable: true,
            },
          },
        },
      });
      console.log(`[FCM] call_ended notification sent to user ${targetUserId}`);
    }
  } catch (e) {
    console.error(`[FCM] Failed to send call_ended notification to ${targetUserId}:`, e);
  }
}

export async function dispatchCallAction(params: {
  action: 'answer' | 'decline' | 'end';
  callId: string;
  senderId: string;
  targetUserId?: string;
  groupId?: string;
}) {
  const io = getIO();
  const { action, callId, senderId, targetUserId, groupId } = params;

  if (action === 'answer') {
    if (targetUserId) {
      io?.to(`user:${targetUserId}`).emit('call_answered', {
        callId,
        answererId: senderId,
      });
    }
  } else if (action === 'decline') {
    if (targetUserId) {
      io?.to(`user:${targetUserId}`).emit('call_declined', {
        callId,
        declinerId: senderId,
      });
      await sendCallEndedFCM(targetUserId, callId);
    }
  } else if (action === 'end') {
    if (targetUserId) {
      io?.to(`user:${targetUserId}`).emit('call_ended', { callId, enderId: senderId });
      await sendCallEndedFCM(targetUserId, callId);
    }
    if (groupId) {
      io?.to(`group:${groupId}`).emit('call_ended', { callId, enderId: senderId });
    }
  }
}
