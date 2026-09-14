import fs from 'fs';
import path from 'path';
import connectDB from './mongodb';
import Message from '../models/Message';

const transitDir = path.join(process.cwd(), 'public', 'transit_uploads');
const MAX_TRANSIT_FILE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export function startBackgroundCleanup() {
  console.log('🧹 [ZeroStore] Ephemeral cleanup worker initialized');

  const runCleanup = async () => {
    try {
      // 1. Clean transit files older than 24 hours
      if (fs.existsSync(transitDir)) {
        const files = await fs.promises.readdir(transitDir);
        const now = Date.now();
        let purgedFiles = 0;

        for (const file of files) {
          const filePath = path.join(transitDir, file);
          try {
            const stats = await fs.promises.stat(filePath);
            if (now - stats.mtimeMs > MAX_TRANSIT_FILE_AGE_MS) {
              await fs.promises.unlink(filePath);
              purgedFiles++;
            }
          } catch (_) {}
        }
        if (purgedFiles > 0) {
          console.log(`🧹 [ZeroStore Cleanup] Purged ${purgedFiles} expired transit media files`);
        }
      }

      // 2. Clean undelivered transit messages older than 14 days from SQLite
      await connectDB();
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const res = await Message.deleteMany({
        createdAt: { $lt: fourteenDaysAgo },
      });
      if (res.deletedCount > 0) {
        console.log(`🧹 [ZeroStore Cleanup] Purged ${res.deletedCount} expired undelivered messages from DB`);
      }

      // 3. Clean auto-deleted/ephemeral messages past their expiration date
      try {
        const getDB = (await import('./sqlite')).default;
        const db = getDB();
        const nowIso = new Date().toISOString();
        const expiredInfo = db.prepare('DELETE FROM messages WHERE expires_at IS NOT NULL AND expires_at <= ?').run(nowIso);
        if (expiredInfo.changes > 0) {
          console.log(`🧹 [AutoDelete Cleanup] Purged ${expiredInfo.changes} auto-deleted/ephemeral messages`);
        }

        // 4. Dispatch scheduled messages that have reached their scheduled time
        const pendingScheduled = db.prepare(`
          SELECT * FROM messages 
          WHERE scheduled_for IS NOT NULL AND scheduled_for <= ? AND is_delivered = 0 AND is_deleted = 0
        `).all(nowIso) as any[];

        if (pendingScheduled.length > 0) {
          const { getIO } = await import('./socket');
          const io = getIO();
          for (const rawMsg of pendingScheduled) {
            db.prepare('UPDATE messages SET scheduled_for = NULL, is_delivered = 1 WHERE id = ?').run(rawMsg.id);
            if (io) {
              const formatted = await (await import('../models/Message')).default.findById(rawMsg.id);
              if (formatted) {
                if (rawMsg.group_id) {
                  io.to(`group:${rawMsg.group_id}`).emit('new_group_message', {
                    message: formatted.toObject(),
                    groupId: rawMsg.group_id,
                  });
                } else if (rawMsg.receiver_id) {
                  const isSelf = rawMsg.receiver_id === rawMsg.sender_id;
                  const roomId = isSelf ? rawMsg.sender_id : [rawMsg.sender_id, rawMsg.receiver_id].sort().join('_');
                  io.to(roomId).emit('new_message', {
                    message: formatted.toObject(),
                    from: rawMsg.sender_id,
                  });
                  if (!isSelf) {
                    io.to(`user:${rawMsg.receiver_id}`).emit('new_message', {
                      message: formatted.toObject(),
                      from: rawMsg.sender_id,
                    });
                  }
                }
              }
            }
          }
          console.log(`⏱️ [Scheduler] Dispatched ${pendingScheduled.length} scheduled messages`);
        }
      } catch (e) {}
    } catch (err) {
      console.error('Error running ephemeral cleanup worker:', err);
    }
  };

  // Run on startup after 5s, then every minute for timely auto-deletion
  setTimeout(runCleanup, 5000);
  setInterval(runCleanup, 60 * 1000);
}
