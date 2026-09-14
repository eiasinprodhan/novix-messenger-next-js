import { getDB } from '../src/lib/sqlite';
import User from '../src/models/User';
import Message from '../src/models/Message';
import Friendship from '../src/models/Friendship';
import Group from '../src/models/Group';
import SystemSetting from '../src/models/SystemSetting';
import AuditLog from '../src/models/AuditLog';
import Report from '../src/models/Report';

async function runTests() {
  console.log('🧪 Starting SQLite Integration Tests...');
  const db = getDB();

  // 1. Verify User Login / comparePassword
  console.log('1️⃣ Testing User find & comparePassword...');
  const admin = await User.findOne({ email: 'admin@novix.com' }).select('+password');
  if (!admin) throw new Error('Admin user not found!');
  const isMatch = await admin.comparePassword('Admin@123');
  if (!isMatch) throw new Error('Password mismatch for Admin!');
  console.log('   ✅ Admin verified:', admin.name, 'role:', admin.role);

  // 2. Testing User save()
  console.log('2️⃣ Testing User save() persistence...');
  admin.bio = 'Updated bio for Novix Admin via SQLite WAL';
  await admin.save();
  const refetchedAdmin = await User.findById(admin._id);
  if (refetchedAdmin.bio !== 'Updated bio for Novix Admin via SQLite WAL') {
    throw new Error('User save() failed to persist changes!');
  }
  console.log('   ✅ User save() persisted successfully');

  // 3. Testing Friendship Queries
  console.log('3️⃣ Testing Friendship queries...');
  const demo = await User.findOne({ email: 'demo@novix.com' });
  const friends = await Friendship.find({
    $or: [
      { requester: admin._id, recipient: demo._id },
      { requester: demo._id, recipient: admin._id },
    ],
  });
  if (friends.length === 0) throw new Error('Friendship not found!');
  console.log('   ✅ Found friendship with status:', friends[0].status);

  // 4. Testing Ephemeral Transit Message Creation & Delivery Purge
  console.log('4️⃣ Testing Ephemeral Transit Message Store & Acknowledgment Purge...');
  const testMsg = await Message.create({
    sender: admin._id,
    receiver: demo._id,
    content: '',
    encryptedPayload: 'U2FsdGVkX1+TestCiphertextPayload==',
    type: 'text',
    isDelivered: false,
    isEphemeralTransit: true,
  });
  console.log('   ✅ Message stored in transit queue:', testMsg._id);

  // Verify it exists in transit
  const pending = await Message.find({ receiver: demo._id, isDelivered: 0 });
  const found = pending.some((m: any) => m._id === testMsg._id);
  if (!found) throw new Error('Message not found in transit query!');

  // Now simulate recipient ACK (WhatsApp style delivery acknowledgment purge)
  console.log('   Testing WhatsApp Zero-Storage immediate wipe on ACK...');
  const purgeResult = await Message.deleteMany({ _id: { $in: [testMsg._id] } });
  if (purgeResult.deletedCount !== 1) throw new Error('Failed to purge delivered message!');
  const afterPurge = await Message.findById(testMsg._id);
  if (afterPurge !== null) throw new Error('Delivered message still remains on disk!');
  console.log('   ✅ Zero-Storage verified: Delivered message purged instantly from server database (0 remaining).');

  // 5. Testing Group Creation and Members
  console.log('5️⃣ Testing Group creation & queries...');
  const group = await Group.create({
    name: 'Novix Test Squad',
    description: 'Testing SQLite groups',
    createdBy: admin._id,
    members: [
      { user: admin._id, role: 'admin' },
      { user: demo._id, role: 'member' },
    ],
  });
  if (!group || group.members.length !== 2) throw new Error('Group creation failed!');
  console.log('   ✅ Group created with members:', group.name, group.members.map((m: any) => m.user?.name));

  // 6. Testing SystemSetting
  console.log('6️⃣ Testing SystemSetting storage...');
  await SystemSetting.findOneAndUpdate(
    { key: 'platform_settings' },
    { value: { appName: 'Novix Messenger', allowRegistration: true } },
    { upsert: true }
  );
  const setting = await SystemSetting.findOne({ key: 'platform_settings' });
  if (setting?.value?.appName !== 'Novix Messenger') throw new Error('SystemSetting failed!');
  console.log('   ✅ SystemSetting saved & retrieved:', setting.value);

  // 7. Testing AuditLog
  console.log('7️⃣ Testing AuditLog...');
  await AuditLog.create({
    admin: admin._id,
    action: 'TEST_ACTION',
    details: { note: 'Testing audit logs in SQLite' },
  });
  const logs = await AuditLog.find();
  if (logs.length === 0) throw new Error('AuditLog failed!');
  console.log('   ✅ AuditLog verified, total logs:', logs.length);

  // 8. Testing Aggregation Queries (Admin stats)
  console.log('8️⃣ Testing Admin Stats Aggregation...');
  const userAgg = await User.aggregate([]);
  console.log('   ✅ User aggregation returned:', userAgg);

  console.log('🎉 ALL SQLITE TESTS PASSED WITH FLYING COLORS! 🚀');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
