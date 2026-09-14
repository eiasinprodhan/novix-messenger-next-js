import { getDB } from '../src/lib/sqlite';

async function clearDB() {
  try {
    console.log('⚡ [SQLite] Clearing all SQLite database tables...');
    const db = getDB();

    const tables = [
      'users',
      'friendships',
      'groups',
      'group_members',
      'messages',
      'stories',
      'reports',
      'audit_logs',
      'system_settings',
    ];

    for (const tbl of tables) {
      db.prepare(`DELETE FROM ${tbl}`).run();
      console.log(`❌ Cleared table: ${tbl}`);
    }

    console.log('✅ SQLite Database tables cleared successfully!');
  } catch (err: any) {
    console.error('❌ Error clearing database:', err.message || err);
  } finally {
    process.exit(0);
  }
}

clearDB();
