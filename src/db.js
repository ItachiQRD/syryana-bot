import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || join(__dirname, '..', 'data');
mkdirSync(dataDir, { recursive: true });

const db = new Database(join(dataDir, 'syryana.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    xp INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    last_daily TEXT,
    last_message_xp TEXT,
    quiz_wins INTEGER DEFAULT 0,
    quiz_played INTEGER DEFAULT 0,
    xp_boost_until TEXT,
    quiz_hint INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS quiz_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    choices TEXT NOT NULL,
    correct_index INTEGER NOT NULL,
    category TEXT DEFAULT 'général',
    used_at TEXT
  );

  CREATE TABLE IF NOT EXISTS quiz_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    question_id INTEGER,
    winner_id TEXT,
    date TEXT DEFAULT (date('now'))
  );

  CREATE TABLE IF NOT EXISTS shop_purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    item_id TEXT,
    cost INTEGER,
    purchased_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS active_quiz (
    guild_id TEXT PRIMARY KEY,
    message_id TEXT,
    question_id INTEGER,
    ends_at TEXT
  );

  CREATE TABLE IF NOT EXISTS verified_members (
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    verified_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, guild_id)
  );

  CREATE TABLE IF NOT EXISTS verification_sessions (
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    step INTEGER DEFAULT 0,
    tries INTEGER DEFAULT 0,
    started_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, guild_id)
  );
`);

try {
  db.exec('ALTER TABLE users ADD COLUMN last_spin TEXT');
} catch {
  /* colonne déjà présente */
}

function migrateUsersPrimaryKey() {
  const def = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get();
  if (!def?.sql || def.sql.includes('PRIMARY KEY (user_id, guild_id)')) return;

  db.exec(`
    CREATE TABLE users_v2 (
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      coins INTEGER DEFAULT 0,
      streak INTEGER DEFAULT 0,
      last_daily TEXT,
      last_message_xp TEXT,
      quiz_wins INTEGER DEFAULT 0,
      quiz_played INTEGER DEFAULT 0,
      xp_boost_until TEXT,
      quiz_hint INTEGER DEFAULT 0,
      last_spin TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, guild_id)
    );
    INSERT OR IGNORE INTO users_v2 (
      user_id, guild_id, xp, coins, streak, last_daily, last_message_xp,
      quiz_wins, quiz_played, xp_boost_until, quiz_hint, last_spin, created_at
    )
    SELECT
      user_id, guild_id, xp, coins, streak, last_daily, last_message_xp,
      quiz_wins, quiz_played, xp_boost_until, quiz_hint, last_spin, created_at
    FROM users;
    DROP TABLE users;
    ALTER TABLE users_v2 RENAME TO users;
  `);
  console.log('✓ Table users migrée (clé user_id + guild_id)');
}

migrateUsersPrimaryKey();

export default db;

export function getUser(userId, guildId) {
  let row = db.prepare('SELECT * FROM users WHERE user_id = ? AND guild_id = ?').get(userId, guildId);
  if (!row) {
    db.prepare('INSERT OR IGNORE INTO users (user_id, guild_id) VALUES (?, ?)').run(userId, guildId);
    row = db.prepare('SELECT * FROM users WHERE user_id = ? AND guild_id = ?').get(userId, guildId);
  }
  return row;
}

export function addXp(userId, guildId, amount) {
  getUser(userId, guildId);
  db.prepare('UPDATE users SET xp = xp + ? WHERE user_id = ? AND guild_id = ?').run(amount, userId, guildId);
  const row = db.prepare('SELECT xp, coins FROM users WHERE user_id = ? AND guild_id = ?').get(userId, guildId);
  const coinsEarned = Math.floor(amount / 10);
  if (coinsEarned > 0) {
    db.prepare('UPDATE users SET coins = coins + ? WHERE user_id = ? AND guild_id = ?').run(coinsEarned, userId, guildId);
  }
  return row;
}

export function getLeaderboard(guildId, limit = 10) {
  return db.prepare(`
    SELECT user_id, xp, coins, streak, quiz_wins
    FROM users WHERE guild_id = ?
    ORDER BY xp DESC LIMIT ?
  `).all(guildId, limit);
}

export function getRandomQuestion() {
  return db.prepare(`
    SELECT * FROM quiz_questions
    WHERE used_at IS NULL OR used_at < date('now', '-30 days')
    ORDER BY RANDOM() LIMIT 1
  `).get();
}

export function markQuestionUsed(id) {
  db.prepare("UPDATE quiz_questions SET used_at = date('now') WHERE id = ?").run(id);
}
