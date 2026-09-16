import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import Group from '@/models/Group';
import User from '@/models/User';
import { getIO, isUserOnline } from '@/lib/socket';
import { messaging } from '@/lib/firebase-admin';

interface GroupSystemMessageOptions {
  groupId: string;
  senderId: string;
  content: string;
  extraUserIdsToNotify?: string[];
  updatedGroup?: any;
}

export async function createGroupSystemMessage({
  groupId,
  senderId,
  content,
  extraUserIdsToNotify = [],
  updatedGroup,
}: GroupSystemMessageOptions) {
  try {
    await connectDB();

    // 1. Create system message document
    const message = await Message.create({
      sender: senderId,
      group: groupId,
      content: content.trim(),
      type: 'system',
      status: 'sent',
      readBy: [senderId],
    });

    const populated = await message.populate('sender', 'name username avatar');

    // 2. Bump group updatedAt
    await Group.findByIdAndUpdate(groupId, { updatedAt: new Date() });

    // 3. Emit via Socket.io
    try {
      const io = getIO();
      if (io) {
        const msgObj = populated.toObject();

        // Emit new_group_message to the group room
        io.to(`group:${groupId}`).emit('new_group_message', {
          message: msgObj,
          groupId,
        });

        // Determine all members to notify in their personal rooms
        const group = updatedGroup || await Group.findById(groupId).select('members');
        const memberIds = new Set<string>();

        if (group?.members && Array.isArray(group.members)) {
          for (const m of group.members) {
            const mId = (m.user?._id || m.user || m)?.toString();
            if (mId) memberIds.add(mId);
          }
        }
        for (const uid of extraUserIdsToNotify) {
          if (uid) memberIds.add(uid);
        }
        if (senderId) memberIds.add(senderId);

        // Emit new_group_message to each member's personal room (updates chat list / last message)
        for (const mId of memberIds) {
          io.to(`user:${mId}`).emit('new_group_message', {
            message: msgObj,
            groupId,
          });
        }

        // If updatedGroup is provided, broadcast group_updated to sync group details/members
        if (updatedGroup) {
          const groupPayload = {
            groupId,
            group: updatedGroup.toObject ? updatedGroup.toObject() : updatedGroup,
          };
          io.to(`group:${groupId}`).emit('group_updated', groupPayload);
          for (const mId of memberIds) {
            io.to(`user:${mId}`).emit('group_updated', groupPayload);
          }
        }
      }
    } catch (sockErr) {
      console.error('[groupSystemMessage] Socket emission failed:', sockErr);
    }

    // 4. Send silent/background notification to offline members if needed
    if (messaging) {
      try {
        const groupDoc = updatedGroup || await Group.findById(groupId).select('name members');
        if (groupDoc) {
          const memberIds: string[] = (groupDoc.members || [])
            .map((m: any) => (m.user?._id || m.user || m)?.toString())
            .filter((id: string) => id && id !== senderId);

          const offlineMembers = memberIds.filter((id) => !isUserOnline(id));
          if (offlineMembers.length > 0) {
            const memberUsers = await User.find(
              { _id: { $in: offlineMembers }, fcmToken: { $exists: true, $ne: '' } },
              'fcmToken'
            ).lean();

            await Promise.allSettled(
              memberUsers.map((member: any) =>
                messaging!.send({
                  token: member.fcmToken,
                  notification: {
                    title: groupDoc.name || 'Group Update',
                    body: content.trim(),
                  },
                  data: {
                    type: 'group_system_message',
                    groupId,
                    content: content.trim(),
                  },
                  android: {
                    priority: 'high',
                    notification: {
                      channelId: 'group_message_channel_id',
                      icon: '@mipmap/ic_launcher',
                    },
                  },
                })
              )
            );
          }
        }
      } catch (fcmErr) {
        console.error('[groupSystemMessage] FCM push failed:', fcmErr);
      }
    }

    return populated;
  } catch (error) {
    console.error('[groupSystemMessage] Error creating group system message:', error);
    return null;
  }
}
