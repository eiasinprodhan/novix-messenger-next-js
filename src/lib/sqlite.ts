import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let dbInstance: Database.Database | null = null;

export function getDB(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'novix.db');
  console.log(`⚡ [SQLite] Initializing SQLite database at: ${dbPath}`);

  const db = new Database(dbPath);

  // Performance Pragmas (WAL mode for ultra-high concurrent reads & sub-millisecond writes)
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');
  db.pragma('temp_store = MEMORY');
  db.pragma('cache_size = -16000');      // 16MB in-memory page cache
  db.pragma('mmap_size = 268435456');     // 256MB memory-mapped zero-copy I/O
  db.pragma('busy_timeout = 5000');       // 5-second queue wait during write concurrency
  db.pragma('auto_vacuum = INCREMENTAL'); // Maintain compact disk footprint

  // Initialize Tables
  initTables(db);

  dbInstance = db;
  return db;
}

function initTables(db: Database.Database) {
  db.exec(`
    -- USERS TABLE
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      bio TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      gender TEXT,
      country TEXT DEFAULT '',
      birthday TEXT,
      is_verified INTEGER DEFAULT 0,
      verification_code TEXT,
      verification_code_expires TEXT,
      verification_resend_at TEXT,
      reset_password_code TEXT,
      reset_password_code_expires TEXT,
      pending_email TEXT,
      pending_email_code TEXT,
      pending_email_code_expires TEXT,
      pending_email_resend_at TEXT,
      google_id TEXT,
      last_seen TEXT,
      last_active_at TEXT,
      is_online INTEGER DEFAULT 0,
      fcm_token TEXT,
      role TEXT DEFAULT 'user',
      notifications_enabled INTEGER DEFAULT 1,
      last_seen_privacy TEXT DEFAULT 'everyone',
      read_receipts_enabled INTEGER DEFAULT 1,
      typing_indicators_enabled INTEGER DEFAULT 1,
      public_key TEXT,
      hidden_chats TEXT DEFAULT '[]',
      devices_json TEXT DEFAULT '[]',
      created_at TEXT,
      updated_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

    -- FRIENDSHIPS TABLE
    CREATE TABLE IF NOT EXISTS friendships (
      id TEXT PRIMARY KEY,
      requester_id TEXT NOT NULL,
      recipient_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY (requester_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_friendships_users ON friendships (requester_id, recipient_id);

    -- GROUPS TABLE
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      created_by TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      invite_token TEXT,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
    );

    -- GROUP MEMBERS TABLE
    CREATE TABLE IF NOT EXISTS group_members (
      group_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at TEXT,
      PRIMARY KEY (group_id, user_id),
      FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- MESSAGES TABLE (Ephemeral Transit Queue)
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      receiver_id TEXT,
      group_id TEXT,
      content TEXT DEFAULT '',
      type TEXT DEFAULT 'text',
      image_url TEXT,
      status TEXT DEFAULT 'sent',
      is_deleted INTEGER DEFAULT 0,
      is_pinned INTEGER DEFAULT 0,
      is_edited INTEGER DEFAULT 0,
      edited_at TEXT,
      reply_to_id TEXT,
      forward_from_json TEXT,
      attachments_json TEXT DEFAULT '[]',
      topic_id TEXT,
      scheduled_for TEXT,
      expires_at TEXT,
      poll_json TEXT,
      reactions_json TEXT DEFAULT '[]',
      read_by_json TEXT DEFAULT '[]',
      deleted_by_json TEXT DEFAULT '[]',
      is_delivered INTEGER DEFAULT 0,
      delivered_at TEXT,
      encrypted_payload TEXT,
      is_ephemeral_transit INTEGER DEFAULT 1,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages (receiver_id, is_delivered);
    CREATE INDEX IF NOT EXISTS idx_messages_group ON messages (group_id, is_delivered);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at);

    -- STORIES TABLE (24h Ephemeral Stories)
    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      media_url TEXT NOT NULL,
      type TEXT DEFAULT 'image',
      caption TEXT DEFAULT '',
      is_archived INTEGER DEFAULT 0,
      views_json TEXT DEFAULT '[]',
      reactions_json TEXT DEFAULT '[]',
      created_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- REPORTS TABLE
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL,
      reported_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      created_at TEXT
    );

    -- AUDIT LOGS TABLE
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      details TEXT DEFAULT '{}',
      ip_address TEXT DEFAULT '',
      created_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);

    -- SYSTEM SETTINGS TABLE
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT
    );

    -- DRAFTS TABLE (Cross-Device Cloud Sync)
    CREATE TABLE IF NOT EXISTS drafts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      content TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_drafts_user_target ON drafts (user_id, target_id);
  `);

  // Safe schema migrations for existing databases
  try {
    const msgCols = db.pragma("table_info(messages)") as Array<{ name: string }>;
    const msgColNames = msgCols.map(c => c.name);
    if (!msgColNames.includes('is_silent')) {
      db.exec("ALTER TABLE messages ADD COLUMN is_silent INTEGER DEFAULT 0;");
    }

    const groupCols = db.pragma("table_info(groups)") as Array<{ name: string }>;
    const groupColNames = groupCols.map(c => c.name);
    if (!groupColNames.includes('slow_mode_seconds')) {
      db.exec("ALTER TABLE groups ADD COLUMN slow_mode_seconds INTEGER DEFAULT 0;");
    }
    if (!groupColNames.includes('permissions_json')) {
      db.exec("ALTER TABLE groups ADD COLUMN permissions_json TEXT DEFAULT '{}';");
    }
    if (!groupColNames.includes('auto_delete_seconds')) {
      db.exec("ALTER TABLE groups ADD COLUMN auto_delete_seconds INTEGER DEFAULT 0;");
    }

    const storyCols = db.pragma("table_info(stories)") as Array<{ name: string }>;
    const storyColNames = storyCols.map(c => c.name);
    if (!storyColNames.includes('is_archived')) {
      db.exec("ALTER TABLE stories ADD COLUMN is_archived INTEGER DEFAULT 0;");
    }
    if (!storyColNames.includes('caption')) {
      db.exec("ALTER TABLE stories ADD COLUMN caption TEXT DEFAULT '';");
    }
    if (!storyColNames.includes('type')) {
      db.exec("ALTER TABLE stories ADD COLUMN type TEXT DEFAULT 'image';");
    }
  } catch (e) {
    console.error("Migration check warning:", e);
  }
}

export default getDB;
