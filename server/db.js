const Database = require('better-sqlite3');
const db = new Database('hashchat.db');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    bio TEXT DEFAULT '',
    profile_pic TEXT DEFAULT '',
    profile_music TEXT DEFAULT '',
    recovery_code TEXT,
    last_seen INTEGER,
    online INTEGER DEFAULT 0,
    birthdate TEXT,
    privacy_lastseen TEXT DEFAULT 'everyone',
    privacy_online TEXT DEFAULT 'everyone',
    blocked_list TEXT DEFAULT '[]',
    theme TEXT DEFAULT 'light',
    bg_image TEXT DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT CHECK(type IN ('private','group','channel')) NOT NULL,
    title TEXT,
    creator_id INTEGER,
    created_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS chat_members (
    user_id INTEGER,
    chat_id INTEGER,
    role TEXT DEFAULT 'member',
    joined_at INTEGER,
    muted INTEGER DEFAULT 0,
    archived INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, chat_id)
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER,
    sender_id INTEGER,
    reply_to INTEGER,
    message TEXT,
    type TEXT DEFAULT 'text',
    media_url TEXT,
    media_type TEXT,
    sticker_id TEXT,
    gif_url TEXT,
    created_at INTEGER,
    edited INTEGER DEFAULT 0,
    pinned INTEGER DEFAULT 0,
    deleted INTEGER DEFAULT 0
  );
`);

module.exports = db;
