import { UserModel, FriendshipModel, GroupModel } from '../src/models/sqlite-models';
import bcrypt from 'bcryptjs';

const DEFAULT_PASSWORD = 'Password123!';
const ADMIN_PASSWORD = 'Admin@123';

const SEED_USERS = [
  {
    name: 'Novix Admin',
    username: 'novixadmin',
    email: 'admin@novix.com',
    password: ADMIN_PASSWORD,
    bio: 'Novix System Administrator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    role: 'admin',
    gender: 'prefer_not_to_say',
    country: 'United States',
  },
  {
    name: 'Demo User',
    username: 'demouser',
    email: 'demo@novix.com',
    password: DEFAULT_PASSWORD,
    bio: 'Testing out the future of messaging on Novix 🚀',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    role: 'user',
    gender: 'male',
    country: 'United States',
  },
  {
    name: 'Alex Rivera',
    username: 'alex',
    email: 'alex@novix.com',
    password: DEFAULT_PASSWORD,
    bio: 'Flutter enthusiast & Mobile Dev 📱',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    role: 'user',
    gender: 'male',
    country: 'Canada',
  },
  {
    name: 'Sarah Chen',
    username: 'sarah',
    email: 'sarah@novix.com',
    password: DEFAULT_PASSWORD,
    bio: 'Designer & Coffee Lover ☕',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    role: 'user',
    gender: 'female',
    country: 'Singapore',
  },
  {
    name: 'Michael Johnson',
    username: 'michael',
    email: 'michael@novix.com',
    password: DEFAULT_PASSWORD,
    bio: 'Cloud Architect & Security Specialist ☁️',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    role: 'user',
    gender: 'male',
    country: 'United Kingdom',
  },
  {
    name: 'Emma Watson',
    username: 'emma',
    email: 'emma@novix.com',
    password: DEFAULT_PASSWORD,
    bio: 'Music, Tech, and Cats 🐱',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    role: 'user',
    gender: 'female',
    country: 'Australia',
  },
  {
    name: 'David Kim',
    username: 'david',
    email: 'david@novix.com',
    password: DEFAULT_PASSWORD,
    bio: 'Building awesome apps with Novix 🚀',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    role: 'user',
    gender: 'male',
    country: 'South Korea',
  },
];

async function seedUsers() {
  console.log('⚡ [SQLite] Starting full user seed...');

  const createdUsers: Record<string, any> = {};

  for (const u of SEED_USERS) {
    let existing = await UserModel.findOne({ email: u.email });
    if (!existing) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
      existing = await UserModel.create({
        ...u,
        password: hashedPassword,
        isVerified: true,
      });
      console.log(`  ✅ Created user: ${u.name} (${u.email})`);
    } else {
      console.log(`  ℹ️ User already exists: ${u.email}`);
    }
    createdUsers[u.username] = existing;
  }

  // Create friendships with demo user
  const demo = createdUsers['demouser'];
  if (demo) {
    for (const username of ['alex', 'sarah', 'michael', 'emma', 'david']) {
      const friend = createdUsers[username];
      if (friend) {
        const existingFriendship = await FriendshipModel.findOne({
          $or: [
            { requester: demo._id, recipient: friend._id },
            { requester: friend._id, recipient: demo._id },
          ],
        });
        if (!existingFriendship) {
          await FriendshipModel.create({
            requester: friend._id,
            recipient: demo._id,
            status: 'accepted',
          });
          console.log(`  🤝 Connected @demouser with @${username}`);
        }
      }
    }
  }

  // Create groups
  const admin = createdUsers['novixadmin'];
  if (admin && demo) {
    const existingGroup = (await GroupModel.find()).find((g: any) => g.name === 'Novix Core Community');
    if (!existingGroup) {
      await GroupModel.create({
        name: 'Novix Core Community',
        description: 'Official community for Novix Messenger users and developers',
        createdBy: admin._id,
        members: [
          { user: admin._id, role: 'admin' },
          { user: demo._id, role: 'member' },
          { user: createdUsers['alex']?._id, role: 'member' },
          { user: createdUsers['sarah']?._id, role: 'member' },
        ].filter(m => m.user),
      });
      console.log('  👥 Created group: Novix Core Community');
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ✅  SQLite Seeding completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Admin account (Password: Admin@123):');
  console.log('    • admin@novix.com   (@novixadmin)');
  console.log('  Demo accounts (Password: Password123!):');
  console.log('    • demo@novix.com    (@demouser)');
  console.log('    • alex@novix.com    (@alex)');
  console.log('    • sarah@novix.com   (@sarah)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(0);
}

seedUsers().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
