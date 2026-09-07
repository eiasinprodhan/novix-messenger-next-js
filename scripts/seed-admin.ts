import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (_) {}

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

const ADMIN_EMAIL    = process.argv[2] || 'admin@novix.com';
const ADMIN_PASSWORD = process.argv[3] || 'Admin@123';
const ADMIN_NAME     = process.argv[4] || 'Novix Admin';
const ADMIN_USERNAME = process.argv[5] || 'novixadmin';

async function seedAdmin() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI as string);
  console.log('✅ Connected.');

  const db = mongoose.connection.db!;
  const usersCollection = db.collection('users');

  // Check if admin already exists
  const existing = await usersCollection.findOne({ email: ADMIN_EMAIL.toLowerCase() });

  if (existing) {
    // Promote to admin if not already
    if (existing.role === 'admin') {
      console.log(`ℹ️  User "${ADMIN_EMAIL}" is already an admin. No changes made.`);
    } else {
      await usersCollection.updateOne(
        { _id: existing._id },
        { $set: { role: 'admin', isVerified: true } }
      );
      console.log(`✅ Existing user "${ADMIN_EMAIL}" promoted to admin.`);
    }
    await mongoose.disconnect();
    return;
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

  const now = new Date();

  await usersCollection.insertOne({
    name: ADMIN_NAME,
    username: ADMIN_USERNAME.toLowerCase(),
    email: ADMIN_EMAIL.toLowerCase(),
    password: hashedPassword,
    bio: 'System Administrator',
    avatar: '',
    role: 'admin',
    isVerified: true,
    isOnline: false,
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

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ✅  Admin account created successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  📧 Email    : ${ADMIN_EMAIL}`);
  console.log(`  🔑 Password : ${ADMIN_PASSWORD}`);
  console.log(`  👤 Username : ${ADMIN_USERNAME}`);
  console.log(`  🛡️  Role    : admin`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  → Login at: /admin/login');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.disconnect();
}

seedAdmin().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});
