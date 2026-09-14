import { getDB } from '../src/lib/sqlite';
import { UserModel, FriendshipModel } from '../src/models/sqlite-models';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('⚡ [SQLite Seed] Initializing SQLite database...');
  const db = getDB();

  // 1. Create Admin User
  const adminEmail = 'admin@novix.com';
  let admin = await UserModel.findOne({ email: adminEmail });
  if (!admin) {
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    admin = await UserModel.create({
      name: 'Novix Admin',
      username: 'novixadmin',
      email: adminEmail,
      password: passwordHash,
      role: 'admin',
      isVerified: true,
      bio: 'Novix System Administrator',
    });
    console.log('✅ Created Admin user: admin@novix.com / Admin@123');
  } else {
    console.log('ℹ️ Admin user already exists');
  }

  // 2. Create Demo User
  const demoEmail = 'demo@novix.com';
  let demo = await UserModel.findOne({ email: demoEmail });
  if (!demo) {
    const demoPasswordHash = await bcrypt.hash('Demo@123', 10);
    demo = await UserModel.create({
      name: 'Demo User',
      username: 'demouser',
      email: demoEmail,
      password: demoPasswordHash,
      role: 'user',
      isVerified: true,
      bio: 'Novix Messenger Explorer',
    });
    console.log('✅ Created Demo user: demo@novix.com / Demo@123');
  } else {
    console.log('ℹ️ Demo user already exists');
  }

  // 3. Create Friendship between Admin and Demo
  const friendship = await FriendshipModel.findOne({
    $or: [
      { requester: admin._id, recipient: demo._id, status: 'accepted' },
      { requester: demo._id, recipient: admin._id, status: 'accepted' },
    ],
  });

  if (!friendship) {
    await FriendshipModel.create({
      requester: admin._id,
      recipient: demo._id,
      status: 'accepted',
    });
    console.log('✅ Connected Admin and Demo as accepted friends');
  }

  console.log('🎉 [SQLite Seed] Seeding completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});
