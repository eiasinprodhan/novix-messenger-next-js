import { UserModel } from '../src/models/sqlite-models';
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL    = process.argv[2] || 'admin@novix.com';
const ADMIN_PASSWORD = process.argv[3] || 'Admin@123';
const ADMIN_NAME     = process.argv[4] || 'Novix Admin';
const ADMIN_USERNAME = process.argv[5] || 'novixadmin';

async function seedAdmin() {
  console.log('⚡ [SQLite] Checking Admin account...');
  let admin = await UserModel.findOne({ email: ADMIN_EMAIL });

  if (admin) {
    admin.role = 'admin';
    admin.isVerified = true;
    await admin.save();
    console.log(`✅ Admin "${ADMIN_EMAIL}" verified and active in SQLite.`);
  } else {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await UserModel.create({
      name: ADMIN_NAME,
      username: ADMIN_USERNAME.toLowerCase(),
      email: ADMIN_EMAIL.toLowerCase(),
      password: hashedPassword,
      bio: 'System Administrator',
      role: 'admin',
      isVerified: true,
    });
    console.log(`✅ Admin "${ADMIN_EMAIL}" created successfully in SQLite!`);
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  📧 Email    : ${ADMIN_EMAIL}`);
  console.log(`  🔑 Password : ${ADMIN_PASSWORD}`);
  console.log(`  👤 Username : ${ADMIN_USERNAME}`);
  console.log(`  🛡️  Role    : admin`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
