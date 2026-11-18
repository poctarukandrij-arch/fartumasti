// Слой доступа к базе данных FARTU MASTI.
// SQLite через sql.js (WASM) — не требует нативной сборки, одинаково работает
// локально и в Alpine-контейнере. Все денежные суммы хранятся в копейках (целые).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import initSqlJs from 'sql.js';

const require = createRequire(import.meta.url);

export const DB_PATH =
  process.env.DB_PATH || path.join(process.cwd(), 'data', 'fartu.sqlite');

let raw = null;
let persistTimer = null;
let ready = false;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL UNIQUE,
  username TEXT UNIQUE COLLATE NOCASE,
  first_name TEXT,
  balance INTEGER NOT NULL DEFAULT 0,
  banned INTEGER NOT NULL DEFAULT 0,
  ban_reason TEXT,
  created_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  sound_enabled INTEGER NOT NULL DEFAULT 1,
  notifications_enabled INTEGER NOT NULL DEFAULT 1,
  equipped_deck TEXT NOT NULL DEFAULT 'deck_graphite',
  equipped_table TEXT NOT NULL DEFAULT 'table_graphite',
  equipped_emoji TEXT NOT NULL DEFAULT 'emoji_none',
  equipped_effect TEXT NOT NULL DEFAULT 'effect_none'
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'telegram',
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  durak_user_id INTEGER,
  players_json TEXT NOT NULL,
  rounds INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'playing'
);

CREATE TABLE IF NOT EXISTS match_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  place INTEGER NOT NULL DEFAULT 0,
  is_winner INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'done',
  meta TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  item_id TEXT NOT NULL,
  price INTEGER NOT NULL,
  kind TEXT NOT NULL DEFAULT 'item',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  item_id TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'shop',
  created_at INTEGER NOT NULL,
  UNIQUE (user_id, item_id)
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  method TEXT NOT NULL,
  destination TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at INTEGER NOT NULL,
  processed_at INTEGER
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL,
  confirmation_url TEXT,
  meta TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
  room_id TEXT PRIMARY KEY,
  state TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT,
  user_id INTEGER,
  text TEXT NOT NULL,
  blocked INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS name_changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  old_name TEXT,
  new_name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS error_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL DEFAULT 'error',
  message TEXT NOT NULL,
  stack TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tx_user ON transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_results_user ON match_results (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_room ON chat_logs (room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals (status, created_at DESC);
`;

function schedulePersist() {
  if (!ready) return;
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persistNow();
  }, 120);
  if (typeof persistTimer.unref === 'function') persistTimer.unref();
}

export function persistNow() {
  if (!raw) return;
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const data = Buffer.from(raw.export());
    const tmp = `${DB_PATH}.tmp`;
    fs.writeFileSync(tmp, data);
    fs.renameSync(tmp, DB_PATH);
  } catch (err) {
    console.error('[db] не удалось сохранить базу:', err.message);
  }
}

export async function initDb() {
  if (raw) return db;
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(path.dirname(require.resolve('sql.js')), file),
  });
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  raw = fs.existsSync(DB_PATH)
    ? new SQL.Database(fs.readFileSync(DB_PATH))
    : new SQL.Database();
  raw.run('PRAGMA foreign_keys = ON;');
  raw.run(SCHEMA);
  ready = true;
  persistNow();
  return db;
}

function toParams(params) {
  if (!params) return [];
  return params.map((v) => {
    if (v === undefined || v === null) return null;
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    if (v instanceof Date) return v.getTime();
    return v;
  });
}

export const db = {
  run(sql, params = []) {
    const stmt = raw.prepare(sql);
    try {
      stmt.bind(toParams(params));
      stmt.step();
    } finally {
      stmt.free();
    }
    const changes = raw.getRowsModified();
    const last = raw.exec('SELECT last_insert_rowid() AS id');
    const lastInsertRowid = last.length ? Number(last[0].values[0][0]) : 0;
    schedulePersist();
    return { changes, lastInsertRowid };
  },
  get(sql, params = []) {
    const stmt = raw.prepare(sql);
    try {
      stmt.bind(toParams(params));
      if (!stmt.step()) return null;
      return stmt.getAsObject();
    } finally {
      stmt.free();
    }
  },
  all(sql, params = []) {
    const stmt = raw.prepare(sql);
    const out = [];
    try {
      stmt.bind(toParams(params));
      while (stmt.step()) out.push(stmt.getAsObject());
    } finally {
      stmt.free();
    }
    return out;
  },
  exec(sql) {
    raw.run(sql);
    schedulePersist();
  },
  tx(fn) {
    raw.run('BEGIN');
    try {
      const result = fn();
      raw.run('COMMIT');
      schedulePersist();
      return result;
    } catch (err) {
      try {
        raw.run('ROLLBACK');
      } catch {
        /* игнорируем */
      }
      throw err;
    }
  },
  persist: persistNow,
  get raw() {
    return raw;
  },
};

export function closeDb() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  if (raw) persistNow();
  ready = false;
}

export function logError(level, message, stack = null) {
  try {
    db.run(
      'INSERT INTO error_logs (level, message, stack, created_at) VALUES (?, ?, ?, ?)',
      [level, String(message).slice(0, 2000), stack ? String(stack).slice(0, 4000) : null, Date.now()],
    );
  } catch (err) {
    console.error('[db] не удалось записать лог ошибки:', err.message);
  }
}

export function getSetting(key, fallback = null) {
  const row = db.get('SELECT value FROM settings WHERE key = ?', [key]);
  return row ? row.value : fallback;
}

export function setSetting(key, value) {
  db.run(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, String(value)],
  );
}
