import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

async function clearDB() {
  try {
    const connectDB = (await import('../src/lib/mongodb')).default;
    const User = (await import('../src/models/User')).default;
    const Friendship = (await import('../src/models/Friendship')).default;
    const Group = (await import('../src/models/Group')).default;
    const Message = (await import('../src/models/Message')).default;

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
