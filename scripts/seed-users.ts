import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

import dotenv from 'dotenv';
import { resolve } from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Load env from project root
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env or .env.local');
  process.exit(1);
}

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
    bio: 'Product Designer | UX & clean interfaces 🎨',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    role: 'user',
    gender: 'female',
    country: 'United Kingdom',
  },
  {
    name: 'Michael Johnson',
    username: 'michael',
    email: 'michael@novix.com',
    password: DEFAULT_PASSWORD,
    bio: 'Building scalable distributed systems ⚡',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    role: 'user',
    gender: 'male',
    country: 'Germany',
  },
  {
    name: 'Emma Watson',
    username: 'emma',
    email: 'emma@novix.com',
    password: DEFAULT_PASSWORD,
    bio: 'Community & Developer Relations 🌍',
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
    bio: 'Fullstack engineer & open-source contributor 💻',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    role: 'user',
    gender: 'male',
    country: 'South Korea',
  },
];

async function seedUsers() {
  console.log('⏳ Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI as string);
  console.log('✅ Connected to MongoDB.');

  const db = mongoose.connection.db!;
  const usersCollection = db.collection('users');
  const friendshipsCollection = db.collection('friendships');
  const groupsCollection = db.collection('groups');
  const messagesCollection = db.collection('messages');

  const salt = await bcrypt.genSalt(10);
  const now = new Date();

  console.log('🌱 Seeding users...');
  const userMap: Record<string, any> = {};

  for (const u of SEED_USERS) {
    const hashedPassword = await bcrypt.hash(u.password, salt);
    const existing = await usersCollection.findOne({ email: u.email.toLowerCase() });

    if (existing) {
      await usersCollection.updateOne(
        { _id: existing._id },
        {
          $set: {
            name: u.name,
            username: u.username.toLowerCase(),
            password: hashedPassword,
            bio: u.bio,
            avatar: u.avatar,
            role: u.role,
            gender: u.gender,
            country: u.country,
            isVerified: true,
            isOnline: true,
            lastSeen: now,
            lastActiveAt: now,
            notificationsEnabled: true,
            readReceiptsEnabled: true,
            typingIndicatorsEnabled: true,
            updatedAt: now,
          },
        }
      );
      userMap[u.username] = { ...existing, _id: existing._id };
      console.log(`  Updated user: ${u.name} (@${u.username})`);
    } else {
      const result = await usersCollection.insertOne({
        name: u.name,
        username: u.username.toLowerCase(),
        email: u.email.toLowerCase(),
        password: hashedPassword,
        bio: u.bio,
        avatar: u.avatar,
        role: u.role,
        gender: u.gender,
        country: u.country,
        isVerified: true,
        isOnline: true,
        lastSeen: now,
        lastActiveAt: now,
        notificationsEnabled: true,
        lastSeenPrivacy: 'everyone',
        readReceiptsEnabled: true,
        typingIndicatorsEnabled: true,
        hiddenChats: [],
        devices: [],
        createdAt: now,
        updatedAt: now,
      });
      userMap[u.username] = { ...u, _id: result.insertedId };
      console.log(`  Created user: ${u.name} (@${u.username})`);
    }
  }

  // Create Friendships connecting Demo User with others
  console.log('🤝 Seeding friendships...');
  const demoUser = userMap['demouser'];
  const otherUsers = ['alex', 'sarah', 'michael', 'emma', 'david'];

  for (const username of otherUsers) {
    const other = userMap[username];
    if (demoUser && other) {
      const existing1 = await friendshipsCollection.findOne({
        requester: demoUser._id,
        recipient: other._id,
      });
      const existing2 = await friendshipsCollection.findOne({
        requester: other._id,
        recipient: demoUser._id,
      });

      if (!existing1 && !existing2) {
        await friendshipsCollection.insertOne({
          requester: demoUser._id,
          recipient: other._id,
          status: 'accepted',
          createdAt: new Date(Date.now() - 3600000 * 24),
          updatedAt: new Date(Date.now() - 3600000 * 24),
        });
        console.log(`  Connected: Demo User <-> ${other.name}`);
      }
    }
  }

  // Create sample conversations
  console.log('💬 Seeding sample messages...');
  const alex = userMap['alex'];
  const sarah = userMap['sarah'];

  if (demoUser && alex) {
    await messagesCollection.insertMany([
      {
        sender: alex._id,
        receiver: demoUser._id,
        content: 'Hey there! Welcome to Novix Messenger 🎉',
        type: 'text',
        status: 'read',
        isDeleted: false,
        isPinned: false,
        deletedBy: [],
        reactions: [],
        readBy: [demoUser._id],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
      {
        sender: demoUser._id,
        receiver: alex._id,
        content: 'Hi Alex! The app looks super smooth and fast!',
        type: 'text',
        status: 'read',
        isDeleted: false,
        isPinned: false,
        deletedBy: [],
        reactions: [],
        readBy: [alex._id],
        createdAt: new Date(Date.now() - 1000 * 60 * 50),
        updatedAt: new Date(Date.now() - 1000 * 60 * 50),
      },
      {
        sender: alex._id,
        receiver: demoUser._id,
        content: 'Glad you like it! Let me know if you need any help exploring the features.',
        type: 'text',
        status: 'delivered',
        isDeleted: false,
        isPinned: false,
        deletedBy: [],
        reactions: [{ user: demoUser._id, emoji: '❤️' }],
        readBy: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 15),
        updatedAt: new Date(Date.now() - 1000 * 60 * 15),
      },
    ]);
  }

  if (demoUser && sarah) {
    await messagesCollection.insertMany([
      {
        sender: sarah._id,
        receiver: demoUser._id,
        content: 'Hi! Have you tested the new dark mode theme yet? 🌙',
        type: 'text',
        status: 'read',
        isDeleted: false,
        isPinned: false,
        deletedBy: [],
        reactions: [],
        readBy: [demoUser._id],
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
        updatedAt: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        sender: demoUser._id,
        receiver: sarah._id,
        content: 'Yes, it feels so sleek and premium!',
        type: 'text',
        status: 'delivered',
        isDeleted: false,
        isPinned: false,
        deletedBy: [],
        reactions: [],
        readBy: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 10),
        updatedAt: new Date(Date.now() - 1000 * 60 * 10),
      },
    ]);
  }

  // Create a Demo Group
  console.log('👥 Seeding sample group...');
  const groupMembers = Object.values(userMap).map((u) => ({
    user: u._id,
    role: u.username === 'demouser' || u.username === 'alex' ? 'admin' : 'member',
    joinedAt: now,
  }));

  const existingGroup = await groupsCollection.findOne({ name: 'Novix Team' });
  if (!existingGroup && demoUser) {
    const groupResult = await groupsCollection.insertOne({
      name: 'Novix Team',
      description: 'Official group for Novix Messenger community and team discussions 🚀',
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150',
      createdBy: demoUser._id,
      members: groupMembers,
      isActive: true,
      hideMembers: false,
      groupType: 'general',
      topicsEnabled: false,
      autoApprove: true,
      pendingRequests: [],
      createdAt: now,
      updatedAt: now,
    });

    if (groupResult.insertedId) {
      await messagesCollection.insertOne({
        sender: alex._id,
        group: groupResult.insertedId,
        content: 'Welcome everyone to the Novix Team channel! 🚀',
        type: 'text',
        status: 'sent',
        isDeleted: false,
        isPinned: true,
        deletedBy: [],
        reactions: [{ user: demoUser._id, emoji: '🎉' }],
        readBy: [demoUser._id],
        createdAt: now,
        updatedAt: now,
      });
      console.log('  Created group: Novix Team');
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ✅  Seeding completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Demo accounts (Password: Password123!):');
  console.log('    • demo@novix.com    (@demouser)  - Main Demo User');
  console.log('    • alex@novix.com    (@alex)      - Alex Rivera');
  console.log('    • sarah@novix.com   (@sarah)     - Sarah Chen');
  console.log('    • michael@novix.com (@michael)   - Michael Johnson');
  console.log('    • emma@novix.com    (@emma)      - Emma Watson');
  console.log('    • david@novix.com   (@david)     - David Kim');
  console.log('');
  console.log('  Admin account (Password: Admin@123):');
  console.log('    • admin@novix.com   (@novixadmin) - Novix Admin');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.disconnect();
}

seedUsers().catch((err) => {
  console.error('❌ Seeding failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
