import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

async function clearDB() {
  try {
    const connectDB = (await import('../lib/mongodb')).default;
    const User = (await import('../models/User')).default;
    const Friendship = (await import('../models/Friendship')).default;
    const Group = (await import('../models/Group')).default;
    const Message = (await import('../models/Message')).default;

    console.log('⏳ Connecting to MongoDB...');
    await connectDB();

    console.log('🔥 Clearing database collections...');

    const deletedUsers = await User.deleteMany({});
    console.log(`❌ Deleted ${deletedUsers.deletedCount} users.`);

    const deletedFriendships = await Friendship.deleteMany({});
    console.log(`❌ Deleted ${deletedFriendships.deletedCount} friendships.`);

    const deletedGroups = await Group.deleteMany({});
    console.log(`❌ Deleted ${deletedGroups.deletedCount} groups.`);

    const deletedMessages = await Message.deleteMany({});
    console.log(`❌ Deleted ${deletedMessages.deletedCount} messages.`);

    console.log('✅ Database cleared successfully!');
  } catch (err: any) {
    console.error('❌ Error clearing database:', err.message || err);
  } finally {
    process.exit(0);
  }
}

clearDB();
